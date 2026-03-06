import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import axios from 'axios';
import { Prisma } from '@prisma/client';
import {
  ImportJobStatusResponse,
  ImportProvider,
  MergedProfileDraft,
  StartOnboardingImportPayload,
} from '@nextjs-blox/shared-types';
import { PrismaService } from '../prisma/prisma.service';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:3334';
const QUEUE_STALL_RECOVERY_MS = 8_000;

const ALLOWED_PROVIDERS = new Set<ImportProvider>([
  'linkedin',
  'github',
  'upwork',
  'fiverr',
  'behance',
  'dribbble',
  'figma',
  'coursera',
  'udemy',
]);

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('import-unify') private readonly importQueue: Queue,
  ) {}

  async startImport(userId: string, payload: StartOnboardingImportPayload) {
    const input = this.asRecord(payload);
    const persona = this.text(input.persona) || 'Professional';
    const personalSiteUrl = this.text(input.personalSiteUrl) || null;
    const locationHint = this.text(input.locationHint) || null;
    const focusQuestion = this.text(input.focusQuestion) || null;

    const providers = this.normalizeProviders(input.providers);
    if (providers.length === 0) {
      throw new BadRequestException('At least one provider is required');
    }

    const compactFallback = this.compactManualFallback(
      this.asRecord(input.manualFallback),
    );
    const session = await this.prisma.onboardingSession.create({
      data: {
        userId,
        persona,
        selectedProviders: providers,
        personalSiteUrl,
        status: 'in_progress',
      },
    });

    const run = await this.prisma.profileImportRun.create({
      data: {
        userId,
        onboardingSessionId: session.id,
        providers,
        status: 'queued',
        progressPct: 2,
        metrics: {
          mode: 'queue',
          requestedAt: new Date().toISOString(),
          requestSnapshot: {
            persona,
            providers,
            personalSiteUrl,
            locationHint,
            focusQuestion,
            manualFallback: compactFallback,
          },
        } as unknown as Prisma.InputJsonValue,
      },
    });

    try {
      const job = await this.importQueue.add('import-unify', {
        runId: run.id,
        userId,
        providers,
        persona,
        personalSiteUrl,
        locationHint,
        focusQuestion,
        manualFallback: compactFallback ?? null,
      });

      await this.prisma.profileImportRun.update({
        where: { id: run.id },
        data: { queueJobId: String(job.id) },
      });

      return {
        runId: run.id,
        queueJobId: String(job.id),
        status: 'queued',
        progressPct: 2,
      } satisfies ImportJobStatusResponse;
    } catch {
      await this.prisma.profileImportRun.update({
        where: { id: run.id },
        data: {
          statusMessage: 'Queue unavailable. Starting fast recovery import.',
          progressPct: 4,
        },
      });

      void this.runInlineImport({
        runId: run.id,
        userId,
        persona,
        providers,
        personalSiteUrl,
        locationHint,
        focusQuestion,
        manualFallback: compactFallback ?? undefined,
        reason: 'recovery',
      });

      return {
        runId: run.id,
        queueJobId: 'inline-recovery',
        status: 'running',
        progressPct: 8,
        message: 'Queue unavailable. Fast recovery import started.',
      } satisfies ImportJobStatusResponse;
    }
  }

  async getImportStatus(
    userId: string,
    runId: string,
  ): Promise<ImportJobStatusResponse> {
    const run = await this.prisma.profileImportRun.findFirst({
      where: { id: runId, userId },
      select: {
        id: true,
        status: true,
        progressPct: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        draftAssetId: true,
        statusMessage: true,
        providers: true,
        metrics: true,
        onboardingSession: {
          select: {
            persona: true,
            personalSiteUrl: true,
          },
        },
      },
    });

    if (!run) {
      throw new NotFoundException('Import run not found');
    }

    if (
      this.enableQueueRecovery() &&
      run.status === 'queued' &&
      run.progressPct <= 2 &&
      Date.now() - run.createdAt.getTime() >= QUEUE_STALL_RECOVERY_MS
    ) {
      const snapshot = this.readRequestSnapshot(run.metrics);
      void this.runInlineImport({
        runId: run.id,
        userId,
        persona:
          snapshot?.persona ?? run.onboardingSession?.persona ?? 'Professional',
        providers:
          snapshot?.providers?.length > 0
            ? snapshot.providers
            : this.normalizeProviders(run.providers),
        personalSiteUrl:
          snapshot?.personalSiteUrl ??
          run.onboardingSession?.personalSiteUrl ??
          null,
        locationHint: snapshot?.locationHint ?? null,
        focusQuestion: snapshot?.focusQuestion ?? null,
        manualFallback: snapshot?.manualFallback ?? undefined,
        reason: 'recovery',
      });
      return {
        runId: run.id,
        status: 'running',
        progressPct: 8,
        startedAt: run.startedAt?.toISOString(),
        completedAt: run.completedAt?.toISOString(),
        draftAssetId: run.draftAssetId ?? undefined,
        message: 'Queue stalled. Fast recovery import started.',
      };
    }

    return {
      runId: run.id,
      status: run.status as ImportJobStatusResponse['status'],
      progressPct: run.progressPct,
      startedAt: run.startedAt?.toISOString(),
      completedAt: run.completedAt?.toISOString(),
      draftAssetId: run.draftAssetId ?? undefined,
      message: run.statusMessage ?? undefined,
    };
  }

  async getLatestUnfinishedImport(userId: string) {
    const run = await this.prisma.profileImportRun.findFirst({
      where: {
        userId,
        status: {
          in: ['queued', 'running', 'awaiting_review', 'partial', 'failed'],
        },
      },
      include: {
        onboardingSession: {
          select: {
            persona: true,
            selectedProviders: true,
            personalSiteUrl: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!run) return null;

    return {
      runId: run.id,
      status: run.status,
      progressPct: run.progressPct,
      message: run.statusMessage ?? null,
      draftAssetId: run.draftAssetId ?? null,
      startedAt: run.startedAt.toISOString(),
      updatedAt: run.updatedAt.toISOString(),
      persona: run.onboardingSession.persona,
      selectedProviders: run.onboardingSession.selectedProviders,
      personalSiteUrl: run.onboardingSession.personalSiteUrl,
    };
  }

  async getImportPreview(userId: string, runId: string) {
    const run = await this.prisma.profileImportRun.findFirst({
      where: { id: runId, userId },
      select: { id: true },
    });
    if (!run) throw new NotFoundException('Import run not found');

    const preview = await this.prisma.importedProfileSnapshot.findFirst({
      where: { userId, runId, provider: 'merged_preview' },
      orderBy: { createdAt: 'desc' },
      select: {
        normalizedPayload: true,
        rawPayload: true,
        provider: true,
        createdAt: true,
      },
    });

    if (!preview) {
      return {
        runId,
        status: 'pending',
        preview: null,
      };
    }

    return {
      runId,
      status: 'ready',
      preview: preview.normalizedPayload,
      raw: preview.rawPayload,
      createdAt: preview.createdAt.toISOString(),
    };
  }

  async confirmImport(
    userId: string,
    runId: string,
    payload: {
      overrides?: Partial<MergedProfileDraft>;
      acceptAutoMerge?: boolean;
    },
  ) {
    const run = await this.prisma.profileImportRun.findFirst({
      where: { id: runId, userId },
      include: {
        importedSnapshots: {
          where: { provider: 'merged_preview' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!run) throw new NotFoundException('Import run not found');

    const preview = run.importedSnapshots[0]?.normalizedPayload as
      | Record<string, unknown>
      | undefined;
    if (!preview) {
      throw new BadRequestException('Import preview not ready yet');
    }

    const merged = {
      ...preview,
      ...(payload.overrides ?? {}),
      confirmedAt: new Date().toISOString(),
    };

    if (run.draftAssetId) {
      const mergedContent = {
        ...(preview as object),
        mergedProfile: merged,
        generatingStatus: 'completed',
      } as unknown as Prisma.InputJsonValue;

      await this.prisma.asset.update({
        where: { id: run.draftAssetId },
        data: {
          content: mergedContent,
        },
      });
    }

    await this.prisma.profileImportRun.update({
      where: { id: run.id },
      data: {
        status: 'completed',
        progressPct: 100,
        completedAt: new Date(),
        confirmedPayload: merged as unknown as Prisma.InputJsonValue,
      },
    });

    await this.prisma.onboardingSession.update({
      where: { id: run.onboardingSessionId },
      data: { status: 'completed', completedAt: new Date() },
    });

    return {
      runId: run.id,
      draftAssetId: run.draftAssetId,
      status: 'completed',
    };
  }

  private enableQueueRecovery() {
    const flag = (process.env.ONBOARDING_IMPORT_RECOVERY ?? '')
      .toLowerCase()
      .trim();
    if (['0', 'false', 'off', 'no'].includes(flag)) return false;
    if (['1', 'true', 'on', 'yes'].includes(flag)) return true;
    return true;
  }

  private async runInlineImport(input: {
    runId: string;
    userId: string;
    persona: string;
    providers: ImportProvider[];
    personalSiteUrl?: string | null;
    locationHint?: string | null;
    focusQuestion?: string | null;
    manualFallback?: Record<string, unknown>;
    reason: 'recovery';
  }) {
    const claimed = await this.prisma.profileImportRun.updateMany({
      where: {
        id: input.runId,
        userId: input.userId,
        status: 'queued',
      },
      data: {
        status: 'running',
        progressPct: 10,
        statusMessage: 'Fast recovery import started',
        startedAt: new Date(),
      },
    });
    if (claimed.count === 0) return;

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: input.userId },
        select: { fullName: true, email: true },
      });
      const fallback = input.manualFallback ?? {};
      const profile = this.extractProfile(fallback) ?? {
        name: user?.fullName ?? 'Portfolio Owner',
        headline: `${input.persona} portfolio`,
        summary: '',
        skills: [] as string[],
        links: user?.email ? { email: `mailto:${user.email}` } : {},
        profileImageUrl: '',
      };
      const projects = this.extractProjects(fallback, input.providers);
      const certifications = this.extractCertifications(fallback);
      const skills = [
        ...new Set([
          ...profile.skills,
          ...projects.flatMap((project) => project.tags ?? []),
        ]),
      ].slice(0, 20);
      const name = profile.name || user?.fullName || 'Portfolio Owner';
      const headline = profile.headline || `${input.persona} portfolio`;
      const aboutPrompt = [
        'Write a concise and high-impact professional portfolio about section (120-220 words).',
        `Persona: ${input.persona}`,
        `Name: ${name}`,
        `Headline: ${headline}`,
        `Summary: ${profile.summary}`,
        `Skills: ${skills.join(', ')}`,
        `Projects: ${projects.map((project) => project.name).join(', ')}`,
        `Certifications: ${certifications.map((certification) => certification.title).join(', ')}`,
        `Location: ${input.locationHint ?? ''}`,
        `Focus Question: ${input.focusQuestion ?? ''}`,
        'Output only plain text.',
      ].join('\n');
      const about = await this.generateFastAbout(
        aboutPrompt,
        name,
        headline,
        skills,
      );
      const links: Record<string, string> = { ...profile.links };
      if (input.personalSiteUrl) links.website = input.personalSiteUrl;
      if (!links.email && user?.email) links.email = `mailto:${user.email}`;

      const merged: MergedProfileDraft = {
        name,
        headline,
        whatTheyDo: headline,
        about,
        bio: about,
        skills,
        projects,
        certifications,
        profileImageUrl: profile.profileImageUrl || undefined,
        faviconUrl: undefined,
        links,
        seoKeywords: this.buildSeoKeywords(
          headline,
          skills,
          input.locationHint ?? undefined,
          input.focusQuestion ?? undefined,
        ),
        conflicts: [],
      };

      await this.prisma.profileImportRun.update({
        where: { id: input.runId },
        data: {
          progressPct: 72,
          statusMessage: 'Generating draft portfolio',
        },
      });

      const draft = await this.createInlineDraftAsset(
        input.userId,
        input.runId,
        input.providers,
        merged,
        input.persona,
      );

      await this.prisma.importedProfileSnapshot.create({
        data: {
          runId: input.runId,
          userId: input.userId,
          provider: 'merged_preview',
          rawPayload: merged as unknown as Prisma.InputJsonValue,
          normalizedPayload: merged as unknown as Prisma.InputJsonValue,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
        },
      });

      await this.prisma.profileImportRun.update({
        where: { id: input.runId },
        data: {
          status: 'awaiting_review',
          progressPct: 95,
          statusMessage: 'Ready for review',
          draftAssetId: draft.id,
          metrics: {
            mode: 'inline-recovery',
            recoveryReason: input.reason,
            autoFillScore: this.inlineAutoFillScore(merged),
            completedAt: new Date().toISOString(),
          } as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Inline recovery failed';
      await this.prisma.profileImportRun.update({
        where: { id: input.runId },
        data: {
          status: 'failed',
          progressPct: 100,
          completedAt: new Date(),
          statusMessage: message.slice(0, 500),
        },
      });
    }
  }

  private compactManualFallback(
    fallback?: Record<string, unknown> | null,
  ): Record<string, unknown> | null {
    if (!fallback || typeof fallback !== 'object') return null;
    const cleanedEntries = Object.entries(fallback).map(([provider, value]) => {
      const source = this.asRecord(value);
      const links = Object.entries(this.asRecord(source.links)).reduce<
        Record<string, string>
      >((acc, [key, raw]) => {
        const next = this.text(raw);
        if (!next || next.startsWith('data:')) return acc;
        acc[key] = next;
        return acc;
      }, {});

      const projects = this.array(source.projects)
        .map((item) => this.asRecord(item))
        .map((project) => ({
          name: this.text(project.name) || this.text(project.title),
          description:
            this.text(project.description) || this.text(project.summary),
          url: this.text(project.url),
          tags: this.textArray(project.tags).slice(0, 8),
          caseStudy: this.text(project.caseStudy),
          imageUrl: this.text(project.imageUrl).startsWith('data:')
            ? ''
            : this.text(project.imageUrl),
        }))
        .filter((item) => item.name);

      const certifications = this.array(source.certifications)
        .map((item) => this.asRecord(item))
        .map((certification) => ({
          title:
            this.text(certification.title) || this.text(certification.name),
          issuer: this.text(certification.issuer),
          completedAt:
            this.text(certification.completedAt) ||
            this.text(certification.date),
          imageUrl: this.text(certification.imageUrl).startsWith('data:')
            ? ''
            : this.text(certification.imageUrl),
          proofUrl: this.text(certification.proofUrl).startsWith('data:')
            ? ''
            : this.text(certification.proofUrl),
          proofName: this.text(certification.proofName),
        }))
        .filter((item) => item.title);

      return [
        provider,
        {
          name: this.text(source.name),
          headline: this.text(source.headline),
          summary: this.text(source.summary),
          publicUrl: this.text(source.publicUrl),
          profileImageUrl: this.text(source.profileImageUrl).startsWith('data:')
            ? ''
            : this.text(source.profileImageUrl),
          skills: this.textArray(source.skills).slice(0, 20),
          links,
          projects,
          certifications,
        },
      ] as const;
    });
    return Object.fromEntries(cleanedEntries);
  }

  private readRequestSnapshot(metrics: Prisma.JsonValue | null): {
    persona?: string;
    providers?: ImportProvider[];
    personalSiteUrl?: string | null;
    locationHint?: string | null;
    focusQuestion?: string | null;
    manualFallback?: Record<string, unknown>;
  } | null {
    const metricRecord = this.asRecord(metrics);
    const snapshot = this.asRecord(metricRecord.requestSnapshot);
    if (Object.keys(snapshot).length === 0) return null;
    return {
      persona: this.text(snapshot.persona) || undefined,
      providers: this.normalizeProviders(snapshot.providers),
      personalSiteUrl: this.text(snapshot.personalSiteUrl) || null,
      locationHint: this.text(snapshot.locationHint) || null,
      focusQuestion: this.text(snapshot.focusQuestion) || null,
      manualFallback: this.asRecord(snapshot.manualFallback),
    };
  }

  private extractProfile(fallback: Record<string, unknown>) {
    for (const value of Object.values(fallback)) {
      const row = this.asRecord(value);
      const name = this.text(row.name);
      const headline = this.text(row.headline);
      const summary = this.text(row.summary);
      const profileImageUrl = this.text(row.profileImageUrl);
      const skills = this.textArray(row.skills);
      const links = Object.entries(this.asRecord(row.links)).reduce<
        Record<string, string>
      >((acc, [key, raw]) => {
        const next = this.text(raw);
        if (!next) return acc;
        acc[key] = next;
        return acc;
      }, {});
      const publicUrl = this.text(row.publicUrl);
      if (publicUrl && !links.website) links.website = publicUrl;
      if (!name && !headline && !summary && skills.length === 0) continue;
      return { name, headline, summary, skills, links, profileImageUrl };
    }
    return null;
  }

  private extractProjects(
    fallback: Record<string, unknown>,
    providers: ImportProvider[],
  ): MergedProfileDraft['projects'] {
    const rows: MergedProfileDraft['projects'] = [];
    for (const [providerKey, value] of Object.entries(fallback)) {
      const sourceProvider = this.asImportProvider(providerKey);
      if (!sourceProvider) continue;
      const row = this.asRecord(value);
      const projects = this.array(row.projects).map((item) =>
        this.asRecord(item),
      );
      for (const project of projects) {
        const name = this.text(project.name) || this.text(project.title);
        if (!name) continue;
        rows.push({
          name,
          description:
            this.text(project.description) ||
            this.text(project.summary) ||
            'Project contribution',
          url: this.text(project.url) || undefined,
          source: sourceProvider,
          imageUrl: this.text(project.imageUrl) || undefined,
          tags: this.textArray(project.tags).slice(0, 8),
          caseStudy: this.text(project.caseStudy) || undefined,
        });
      }
    }

    const filtered = rows.filter(
      (item) =>
        item.source === 'github' ||
        item.source === 'behance' ||
        item.source === 'figma',
    );
    const deduped = filtered.filter(
      (item, index, list) =>
        list.findIndex(
          (candidate) =>
            candidate.name.toLowerCase() === item.name.toLowerCase() &&
            (candidate.url ?? '') === (item.url ?? ''),
        ) === index,
    );
    if (deduped.length > 0) return deduped.slice(0, 12);

    const fallbackProvider = providers.find(
      (provider) =>
        provider === 'github' || provider === 'behance' || provider === 'figma',
    );
    if (!fallbackProvider) return [];
    return [
      {
        name: 'Featured Project',
        description:
          'Starter project generated from manual fallback. Add full project details in review.',
        source: fallbackProvider,
      },
    ];
  }

  private extractCertifications(
    fallback: Record<string, unknown>,
  ): MergedProfileDraft['certifications'] {
    const rows: MergedProfileDraft['certifications'] = [];
    for (const [providerKey, value] of Object.entries(fallback)) {
      const sourceProvider = this.asImportProvider(providerKey);
      if (!sourceProvider) continue;
      const row = this.asRecord(value);
      const certifications = this.array(row.certifications).map((item) =>
        this.asRecord(item),
      );
      for (const certification of certifications) {
        const title =
          this.text(certification.title) || this.text(certification.name);
        if (!title) continue;
        rows.push({
          title,
          issuer: this.text(certification.issuer) || undefined,
          completedAt:
            this.text(certification.completedAt) ||
            this.text(certification.date) ||
            undefined,
          imageUrl: this.text(certification.imageUrl) || undefined,
          proofUrl: this.text(certification.proofUrl) || undefined,
          proofName: this.text(certification.proofName) || undefined,
          source: sourceProvider,
        });
      }
    }
    return rows
      .filter(
        (item) => item.source === 'coursera' || item.source === 'udemy',
      )
      .filter(
        (item, index, list) =>
          list.findIndex(
            (candidate) =>
              candidate.title.toLowerCase() === item.title.toLowerCase() &&
              (candidate.issuer ?? '') === (item.issuer ?? ''),
          ) === index,
      )
      .slice(0, 12);
  }

  private async generateFastAbout(
    prompt: string,
    name: string,
    headline: string,
    skills: string[],
  ) {
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/v1/ai/generate`,
        {
          assetType: 'PORTFOLIO',
          prompt,
          context: {},
          preferredRoute: 'generation_critique',
        },
        { timeout: 10_000 },
      );
      const content = this.text(response.data?.content);
      if (content.split(/\s+/).filter(Boolean).length >= 35) {
        return content;
      }
    } catch {
      // fallback below
    }
    const expertise = skills.slice(0, 8).join(', ');
    return `Hi, I'm ${name}. ${headline}. I build practical, high-quality outcomes using ${expertise || 'modern digital tools'} while keeping execution reliable and communication clear.`;
  }

  private buildSeoKeywords(
    headline: string,
    skills: string[],
    location?: string,
    focusQuestion?: string,
  ) {
    const tokens = [
      ...headline.split(/\s+/),
      ...skills,
      ...(location ? location.split(/\s+/) : []),
      ...(focusQuestion ? focusQuestion.split(/\s+/) : []),
    ]
      .map((item) => item.trim().toLowerCase().replace(/[^a-z0-9]/g, ''))
      .filter((item) => item.length > 2);
    const unique: string[] = [];
    for (const token of tokens) {
      if (unique.includes(token)) continue;
      unique.push(token);
      if (unique.length >= 16) break;
    }
    return unique;
  }

  private inlineTemplateForPersona(persona: string) {
    if (persona === 'Designer') return 'portfolio-gallery-creative';
    if (persona === 'Developer') return 'portfolio-timeline-dev';
    if (persona === 'Freelancer') return 'portfolio-freelance-conversion';
    if (persona === 'Executive') return 'portfolio-executive-outcomes';
    if (persona === 'Student') return 'portfolio-starter-compact';
    return 'portfolio-modern-001';
  }

  private inlineAutoFillScore(merged: MergedProfileDraft) {
    const checks = [
      !!merged.name,
      !!merged.headline,
      !!merged.about && merged.about.length > 90,
      (merged.skills ?? []).length >= 3,
      (merged.projects ?? []).length > 0 || (merged.certifications ?? []).length > 0,
      Object.keys(merged.links ?? {}).length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }

  private async createInlineDraftAsset(
    userId: string,
    runId: string,
    providers: ImportProvider[],
    merged: MergedProfileDraft,
    persona: string,
  ) {
    const title = `${merged.name} Portfolio`;
    const content = {
      generatingStatus: 'completed',
      templateId: this.inlineTemplateForPersona(persona),
      hero: { heading: merged.name, body: merged.headline },
      about: { body: merged.about },
      projects: {
        items: merged.projects.map((project) => ({
          title: project.name,
          description: project.description,
          url: project.url,
          imageUrl: project.imageUrl,
          tags: project.tags,
          caseStudy: project.caseStudy,
        })),
      },
      certifications: {
        items: merged.certifications.map((item) => ({
          title: item.title,
          issuer: item.issuer,
          date: item.completedAt,
          imageUrl: item.imageUrl,
          proofUrl: item.proofUrl,
          proofName: item.proofName,
        })),
      },
      skills: { items: merged.skills },
      links: Object.entries(merged.links).map(([label, url]) => ({
        label,
        url,
      })),
      profile: {
        avatarUrl: merged.profileImageUrl,
        faviconUrl: merged.faviconUrl ?? undefined,
      },
      importMeta: {
        runId,
        sourceProviders: providers,
        conflicts: merged.conflicts,
        seoKeywords: merged.seoKeywords,
        autoFillScore: this.inlineAutoFillScore(merged),
        mode: 'inline-recovery',
      },
      mergedProfile: merged,
    } as unknown as Prisma.InputJsonValue;

    const asset = await this.prisma.asset.create({
      data: {
        userId,
        type: 'PORTFOLIO',
        title,
        slug: this.slugify(title),
        visibility: 'PRIVATE',
        healthScore: 82,
        content,
      },
    });

    await this.prisma.assetVersion.create({
      data: {
        assetId: asset.id,
        versionLabel: 'v1.0 (Fast Recovered Draft)',
        branchName: 'main',
        content,
        createdBy: userId,
      },
    });

    return asset;
  }

  private normalizeProviders(input: unknown): ImportProvider[] {
    const values = Array.isArray(input) ? input : [];
    const unique = new Set<ImportProvider>();
    for (const value of values) {
      if (typeof value !== 'string') continue;
      const provider = this.asImportProvider(value);
      if (!provider) continue;
      unique.add(provider);
    }
    return Array.from(unique);
  }

  private asImportProvider(value: string): ImportProvider | null {
    return ALLOWED_PROVIDERS.has(value as ImportProvider)
      ? (value as ImportProvider)
      : null;
  }

  private asRecord(value: unknown) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }

  private text(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
  }

  private array(value: unknown) {
    return Array.isArray(value) ? value : [];
  }

  private textArray(value: unknown) {
    if (Array.isArray(value))
      return value.map((item) => this.text(item)).filter(Boolean);
    if (typeof value === 'string') {
      return value
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [] as string[];
  }

  private slugify(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
  }
}
