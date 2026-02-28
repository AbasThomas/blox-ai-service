import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import axios from 'axios';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:3334';

type ProviderId =
  | 'linkedin'
  | 'github'
  | 'upwork'
  | 'fiverr'
  | 'behance'
  | 'dribbble'
  | 'figma'
  | 'coursera';

interface ImportJobPayload {
  runId: string;
  userId: string;
  providers: ProviderId[];
  persona: string;
  personalSiteUrl?: string | null;
  locationHint?: string | null;
  manualFallback?: Record<string, unknown> | null;
}

interface ProviderImportData {
  provider: ProviderId;
  name?: string;
  headline?: string;
  summary?: string;
  profileImageUrl?: string;
  skills: string[];
  projects: Array<{ name: string; description: string; url?: string }>;
  links: Record<string, string>;
  raw?: unknown;
}

interface MergeConflict {
  field: 'name' | 'headline';
  recommendedProvider: string;
  recommendedValue: string;
  candidates: Array<{ provider: string; value: string }>;
}

interface MergedProfilePayload {
  name: string;
  headline: string;
  whatTheyDo: string;
  about: string;
  bio: string;
  skills: string[];
  projects: Array<{ name: string; description: string; url?: string; source: ProviderId }>;
  links: Record<string, string>;
  location?: string;
  persona: string;
  profileImageUrl?: string;
  faviconUrl?: string;
  conflicts: MergeConflict[];
  seoKeywords: string[];
}

@Processor('import-unify')
export class ImportUnifyProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportUnifyProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<ImportJobPayload>) {
    const { runId, userId, providers, persona, personalSiteUrl, locationHint, manualFallback } = job.data;
    await this.updateRun(runId, {
      status: 'running',
      progressPct: 10,
      statusMessage: 'Import started',
      startedAt: new Date(),
    });

    try {
      const tokens = await this.resolveTokens(userId, providers);
      const imported: ProviderImportData[] = [];
      const failed: ProviderId[] = [];

      for (const provider of providers) {
        try {
          const data = await this.fetchProvider(provider, tokens[provider], manualFallback ?? {});
          imported.push(data);
          await this.saveSnapshot(runId, userId, provider, data.raw, data);
        } catch (error) {
          failed.push(provider);
          imported.push({ provider, skills: [], projects: [], links: {} });
          this.logger.warn(`[import-unify] ${provider} failed: ${this.toErr(error)}`);
        }
      }

      await this.updateRun(runId, { progressPct: 45, statusMessage: 'Merging imported profiles' });
      const merged = await this.mergeAndGenerateAbout(imported, persona, locationHint ?? undefined);
      merged.faviconUrl = await this.extractFaviconUrl(personalSiteUrl ?? undefined);

      await this.updateRun(runId, { progressPct: 75, statusMessage: 'Creating draft portfolio' });
      const asset = await this.createDraftAsset(userId, runId, providers, merged);

      await this.saveSnapshot(runId, userId, 'merged_preview', merged, merged);

      const status = failed.length > 0 ? 'partial' : 'awaiting_review';
      await this.updateRun(runId, {
        status,
        progressPct: 95,
        statusMessage: failed.length > 0 ? `Partial import: ${failed.join(', ')}` : 'Ready for review',
        draftAssetId: asset.id,
        metrics: {
          failedProviders: failed,
          autoFillScore: this.autoFillScore(merged),
        },
      });

      await this.prisma.notification.create({
        data: {
          userId,
          type: 'import_completed',
          title: failed.length > 0 ? 'Import completed with partial data' : 'Import completed',
          payload: {
            runId,
            draftAssetId: asset.id,
            failedProviders: failed,
          },
        },
      });

      return { runId, status, draftAssetId: asset.id };
    } catch (error) {
      await this.updateRun(runId, {
        status: 'failed',
        progressPct: 100,
        statusMessage: this.toErr(error),
        completedAt: new Date(),
      });
      throw error;
    }
  }

  private async resolveTokens(userId: string, providers: ProviderId[]) {
    const rows = await this.prisma.oAuthConnection.findMany({
      where: { userId, provider: { in: providers } },
      select: { provider: true, accessToken: true },
    });
    return Object.fromEntries(rows.map((row) => [row.provider, row.accessToken ?? ''])) as Record<ProviderId, string>;
  }

  private async fetchProvider(provider: ProviderId, token: string, fallback: Record<string, unknown>) {
    if (provider === 'linkedin' && token) {
      const profile = await axios.get('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15_000,
      });
      return {
        provider,
        name: `${profile.data.localizedFirstName ?? ''} ${profile.data.localizedLastName ?? ''}`.trim() || undefined,
        headline: profile.data.localizedHeadline ?? undefined,
        summary: profile.data.summary ?? undefined,
        profileImageUrl: profile.data.profilePicture?.displayImage ?? undefined,
        skills: [],
        projects: [],
        links: profile.data.id ? { linkedin: `https://www.linkedin.com/in/${profile.data.id}` } : {},
        raw: profile.data,
      } satisfies ProviderImportData;
    }

    if (provider === 'github' && token) {
      const [userRes, reposRes] = await Promise.all([
        axios.get('https://api.github.com/user', {
          headers: { Authorization: `token ${token}` },
          timeout: 15_000,
        }),
        axios.get('https://api.github.com/user/repos?sort=updated&per_page=12', {
          headers: { Authorization: `token ${token}` },
          timeout: 15_000,
        }),
      ]);

      const repos = reposRes.data as Array<Record<string, unknown>>;
      const projects = repos.slice(0, 8).map((repo) => ({
        name: this.text(repo.name) || 'Project',
        description: this.text(repo.description) || 'Open-source project',
        url: this.text(repo.html_url) || undefined,
      }));
      const skills = [...new Set(repos.map((repo) => this.text(repo.language)).filter(Boolean))];

      return {
        provider,
        name: userRes.data.name ?? userRes.data.login ?? undefined,
        summary: userRes.data.bio ?? undefined,
        profileImageUrl: userRes.data.avatar_url ?? undefined,
        skills,
        projects,
        links: userRes.data.html_url ? { github: userRes.data.html_url } : {},
        raw: { user: userRes.data, repos: reposRes.data },
      } satisfies ProviderImportData;
    }

    if (provider === 'upwork' && token) {
      const query = `query ImportProfile { profile { identity { fullName title overview picture location { city country } } skills { nodes { name } } profileRate { amount } } }`;
      const res = await axios.post(
        process.env.UPWORK_GRAPHQL_URL ?? 'https://www.upwork.com/api/graphql/v1',
        { query },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 20_000 },
      );
      const profile = res.data?.data?.profile;
      const name = profile?.identity?.fullName ?? undefined;
      const headline = profile?.identity?.title ?? undefined;
      const summary = profile?.identity?.overview ?? undefined;
      const skills = ((profile?.skills?.nodes ?? []) as Array<Record<string, unknown>>)
        .map((row) => this.text(row.name))
        .filter(Boolean)
        .slice(0, 15);
      return {
        provider,
        name,
        headline,
        summary,
        profileImageUrl: profile?.identity?.picture ?? undefined,
        skills,
        projects: [],
        links: {},
        raw: res.data,
      } satisfies ProviderImportData;
    }

    const fromFallback = this.asRecord(fallback[provider]);
    return {
      provider,
      name: this.text(fromFallback.name),
      headline: this.text(fromFallback.headline),
      summary: this.text(fromFallback.summary),
      profileImageUrl: this.text(fromFallback.profileImageUrl),
      skills: this.array(fromFallback.skills),
      projects: [],
      links: {},
      raw: fromFallback,
    } satisfies ProviderImportData;
  }

  private async mergeAndGenerateAbout(
    imported: ProviderImportData[],
    persona: string,
    location?: string,
  ): Promise<MergedProfilePayload> {
    const linkedin = imported.find((item) => item.provider === 'linkedin');
    const upwork = imported.find((item) => item.provider === 'upwork');
    const github = imported.find((item) => item.provider === 'github');
    const skills = [...new Set([...(upwork?.skills ?? []), ...(github?.skills ?? []), ...(linkedin?.skills ?? [])])].slice(0, 20);
    const name = linkedin?.name || upwork?.name || github?.name || 'Portfolio Owner';
    const headline = linkedin?.headline || upwork?.headline || github?.headline || `${persona} portfolio`;
    const whatTheyDo = [headline, upwork?.headline].filter(Boolean).join(' | ') || headline;
    const projects = imported.flatMap((item) => item.projects.map((project) => ({ ...project, source: item.provider }))).slice(0, 10);
    const links = imported.reduce<Record<string, string>>((acc, item) => ({ ...acc, ...item.links }), {});
    const summaryText = [linkedin?.summary, linkedin?.headline, upwork?.summary, skills.join(', ')].filter(Boolean).join('\n');

    const prompt = [
      'Refine this user professional bio into a compelling, SEO-optimized About section for a portfolio (150-300 words).',
      'Make it first-person, engaging, and achievement-focused.',
      `Tone: ${this.personaTone(persona)}.`,
      `Name: ${name}`,
      `Headline: ${headline}`,
      `LinkedIn Summary: ${linkedin?.summary ?? ''}`,
      `Upwork Overview: ${upwork?.summary ?? ''}`,
      `Skills: ${skills.join(', ')}`,
      `What they do: ${whatTheyDo}`,
      `Location: ${location ?? ''}`,
      `Fallback source: ${summaryText}`,
      'Output only final text.',
    ].join('\n');

    const about = await this.generateAbout(prompt, name, headline, skills);
    const seoKeywords = this.seoKeywords(headline, skills, location);
    const conflicts = this.conflicts({ linkedin, upwork, github });

    return {
      name,
      headline,
      whatTheyDo,
      about,
      bio: about,
      skills,
      projects,
      links,
      location,
      persona,
      profileImageUrl: linkedin?.profileImageUrl || github?.profileImageUrl || upwork?.profileImageUrl || undefined,
      conflicts,
      seoKeywords,
    };
  }

  private async createDraftAsset(
    userId: string,
    runId: string,
    providers: ProviderId[],
    merged: MergedProfilePayload,
  ) {
    const title = `${merged.name} Portfolio`;
    const content = {
      generatingStatus: 'completed',
      templateId: this.personaTemplate(merged.persona),
      hero: { heading: merged.name, body: merged.headline },
      about: { body: merged.about },
      projects: { items: merged.projects.map((project) => `${project.name} - ${project.description}`) },
      skills: { items: merged.skills },
      contact: { body: Object.entries(merged.links).map(([k, v]) => `${k}: ${v}`).join(' | ') },
      links: Object.entries(merged.links).map(([label, url]) => ({ label, url })),
      profile: { avatarUrl: merged.profileImageUrl, faviconUrl: merged.faviconUrl ?? undefined },
      importMeta: {
        runId,
        sourceProviders: providers,
        conflicts: merged.conflicts,
        seoKeywords: merged.seoKeywords,
        autoFillScore: this.autoFillScore(merged),
      },
      mergedProfile: merged,
    };
    const typedContent = content as unknown as Prisma.InputJsonValue;

    const asset = await this.prisma.asset.create({
      data: {
        userId,
        type: 'PORTFOLIO',
        title,
        slug: this.slugify(title),
        visibility: 'PRIVATE',
        healthScore: 84,
        content: typedContent,
      },
    });

    await this.prisma.assetVersion.create({
      data: {
        assetId: asset.id,
        versionLabel: 'v1.0 (Imported Draft)',
        branchName: 'main',
        content: typedContent,
        createdBy: userId,
      },
    });

    return asset;
  }

  private async generateAbout(prompt: string, name: string, headline: string, skills: string[]) {
    try {
      const res = await axios.post(
        `${AI_SERVICE_URL}/v1/ai/generate`,
        {
          assetType: 'PORTFOLIO',
          prompt,
          context: {},
          preferredRoute: 'generation_critique',
        },
        { timeout: 30_000 },
      );
      const output = this.text(res.data?.content);
      if (output.split(/\s+/).filter(Boolean).length >= 70) {
        return output;
      }
    } catch {
      // fallback below
    }
    return `Hi, I'm ${name}. ${headline}. I focus on delivering measurable outcomes and building high-quality work across ${skills.slice(0, 8).join(', ')}. I combine strong execution, clear communication, and a pragmatic approach to ship work that creates real impact.`;
  }

  private async extractFaviconUrl(personalSiteUrl?: string) {
    if (!personalSiteUrl) return undefined;
    try {
      const normalized = personalSiteUrl.startsWith('http') ? personalSiteUrl : `https://${personalSiteUrl}`;
      const direct = new URL('/favicon.ico', normalized).toString();
      const headRes = await axios.get(direct, { timeout: 5_000, validateStatus: () => true });
      if (headRes.status >= 200 && headRes.status < 400) return direct;
      const page = await axios.get(normalized, { timeout: 8_000 });
      const html = typeof page.data === 'string' ? page.data : '';
      const match = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i);
      if (match?.[1]) return new URL(match[1], normalized).toString();
      return `https://www.google.com/s2/favicons?domain=${new URL(normalized).host}&sz=128`;
    } catch {
      return undefined;
    }
  }

  private async saveSnapshot(runId: string, userId: string, provider: string, raw: unknown, normalized: unknown) {
    await this.prisma.importedProfileSnapshot.create({
      data: {
        runId,
        userId,
        provider,
        rawPayload: raw as unknown as Prisma.InputJsonValue,
        normalizedPayload: normalized as unknown as Prisma.InputJsonValue,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      },
    });
  }

  private async updateRun(runId: string, patch: Prisma.ProfileImportRunUpdateInput) {
    await this.prisma.profileImportRun.update({
      where: { id: runId },
      data: patch,
    });
  }

  private autoFillScore(merged: MergedProfilePayload) {
    const checks = [
      !!merged.name,
      !!merged.headline,
      !!merged.about && merged.about.length > 120,
      (merged.skills ?? []).length >= 6,
      (merged.projects ?? []).length >= 2,
      Object.keys(merged.links ?? {}).length > 0,
      !!merged.profileImageUrl,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }

  private personaTone(persona: string) {
    if (persona === 'Freelancer') return 'confident for freelancers';
    if (persona === 'Designer') return 'creative and product-minded';
    if (persona === 'Developer') return 'technical and concise';
    if (persona === 'Executive') return 'strategic and high-impact';
    if (persona === 'Student') return 'growth-oriented and proactive';
    return 'professional and clear';
  }

  private personaTemplate(persona: string) {
    if (persona === 'Designer') return 'portfolio-gallery-creative';
    if (persona === 'Developer') return 'portfolio-timeline-dev';
    if (persona === 'Freelancer') return 'portfolio-freelance-conversion';
    if (persona === 'Executive') return 'portfolio-executive-outcomes';
    if (persona === 'Student') return 'portfolio-starter-compact';
    return 'portfolio-modern-001';
  }

  private seoKeywords(headline: string, skills: string[], location?: string) {
    const tokens = [...headline.split(/\s+/), ...skills, location ?? '']
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 2);
    const unique: string[] = [];
    for (const token of tokens) {
      if (unique.includes(token)) continue;
      unique.push(token);
      if (unique.length >= 14) break;
    }
    if (location && skills[0]) unique.push(`${skills[0].toLowerCase()} ${location.toLowerCase()}`);
    return unique.slice(0, 16);
  }

  private conflicts(input: {
    linkedin?: ProviderImportData;
    upwork?: ProviderImportData;
    github?: ProviderImportData;
  }): MergeConflict[] {
    const out: MergeConflict[] = [];
    const nameCandidates = [
      { provider: 'linkedin', value: input.linkedin?.name ?? '' },
      { provider: 'upwork', value: input.upwork?.name ?? '' },
      { provider: 'github', value: input.github?.name ?? '' },
    ].filter((item) => item.value);
    if (new Set(nameCandidates.map((item) => item.value.toLowerCase())).size > 1) {
      out.push({
        field: 'name',
        recommendedProvider: nameCandidates[0].provider,
        recommendedValue: nameCandidates[0].value,
        candidates: nameCandidates,
      });
    }

    const headlineCandidates = [
      { provider: 'linkedin', value: input.linkedin?.headline ?? '' },
      { provider: 'upwork', value: input.upwork?.headline ?? '' },
      { provider: 'github', value: input.github?.headline ?? '' },
    ].filter((item) => item.value);
    if (new Set(headlineCandidates.map((item) => item.value.toLowerCase())).size > 1) {
      out.push({
        field: 'headline',
        recommendedProvider: headlineCandidates[0].provider,
        recommendedValue: headlineCandidates[0].value,
        candidates: headlineCandidates,
      });
    }
    return out;
  }

  private asRecord(value: unknown) {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
    return {};
  }

  private text(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
  }

  private array(value: unknown) {
    if (Array.isArray(value)) return value.map((item) => this.text(item)).filter(Boolean);
    if (typeof value === 'string') return value.split(/[\\n,]+/).map((item) => item.trim()).filter(Boolean);
    return [] as string[];
  }

  private toErr(value: unknown) {
    if (value instanceof Error) return value.message;
    if (typeof value === 'string') return value;
    return 'Unknown error';
  }

  private slugify(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  }
}
