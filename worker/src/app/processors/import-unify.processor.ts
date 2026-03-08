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
  | 'canva'
  | 'figma'
  | 'coursera'
  | 'udemy';

interface ImportJobPayload {
  runId: string;
  userId: string;
  providers: ProviderId[];
  persona: string;
  personalSiteUrl?: string | null;
  locationHint?: string | null;
  focusQuestion?: string | null;
  manualFallback?: Record<string, unknown> | null;
}

interface ProviderImportData {
  provider: ProviderId;
  name?: string;
  headline?: string;
  summary?: string;
  profileImageUrl?: string;
  skills: string[];
  projects: Array<{
    name: string;
    description: string;
    url?: string;
    imageUrl?: string;
    tags?: string[];
    caseStudy?: string;
  }>;
  certifications: Array<{
    title: string;
    issuer?: string;
    completedAt?: string;
    imageUrl?: string;
    proofUrl?: string;
    proofName?: string;
  }>;
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
  projects: Array<{
    name: string;
    description: string;
    url?: string;
    imageUrl?: string;
    tags?: string[];
    caseStudy?: string;
    source: ProviderId;
  }>;
  certifications: Array<{
    title: string;
    issuer?: string;
    completedAt?: string;
    imageUrl?: string;
    proofUrl?: string;
    proofName?: string;
    source: ProviderId;
  }>;
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
    const {
      runId,
      userId,
      providers,
      persona,
      personalSiteUrl,
      locationHint,
      focusQuestion,
      manualFallback,
    } = job.data;

    const existingRun = await this.prisma.profileImportRun.findUnique({
      where: { id: runId },
      select: {
        status: true,
        draftAssetId: true,
      },
    });
    if (
      existingRun &&
      (existingRun.status === 'awaiting_review' ||
        existingRun.status === 'partial' ||
        existingRun.status === 'completed') &&
      !!existingRun.draftAssetId
    ) {
      this.logger.log(
        `[import-unify] Skipping ${runId}; already ${existingRun.status}.`,
      );
      return;
    }

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
          const data = await this.fetchProvider(
            provider,
            tokens[provider],
            manualFallback ?? {},
          );
          imported.push(data);
          await this.saveSnapshot(runId, userId, provider, data.raw, data);
        } catch (error) {
          failed.push(provider);
          imported.push({
            provider,
            skills: [],
            projects: [],
            certifications: [],
            links: {},
          });
          this.logger.warn(
            `[import-unify] ${provider} failed: ${this.toErr(error)}`,
          );
        }
      }

      await this.updateRun(runId, {
        progressPct: 45,
        statusMessage: 'Merging imported profiles',
      });
      const merged = await this.mergeAndGenerateAbout(
        imported,
        persona,
        locationHint ?? undefined,
        focusQuestion ?? undefined,
      );
      merged.faviconUrl = await this.extractFaviconUrl(
        personalSiteUrl ?? undefined,
      );

      await this.updateRun(runId, {
        progressPct: 75,
        statusMessage: 'Creating draft portfolio',
      });
      const asset = await this.createDraftAsset(
        userId,
        runId,
        providers,
        merged,
      );

      await this.saveSnapshot(runId, userId, 'merged_preview', merged, merged);

      const status = failed.length > 0 ? 'partial' : 'awaiting_review';
      await this.updateRun(runId, {
        status,
        progressPct: 95,
        statusMessage:
          failed.length > 0
            ? `Partial import: ${failed.join(', ')}`
            : 'Ready for review',
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
          title:
            failed.length > 0
              ? 'Import completed with partial data'
              : 'Import completed',
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
    return Object.fromEntries(
      rows.map((row) => [row.provider, row.accessToken ?? '']),
    ) as Record<ProviderId, string>;
  }

  private async fetchProvider(
    provider: ProviderId,
    token: string,
    fallback: Record<string, unknown>,
  ) {
    if (provider === 'linkedin' && token) {
      return this.fetchLinkedIn(token);
    }

    if (provider === 'figma' && token) {
      return this.fetchFigma(token);
    }

    if (provider === 'dribbble' && token) {
      return this.fetchDribbble(token);
    }

    if (provider === 'canva' && token) {
      return this.fetchCanva(token);
    }

    if (provider === 'github' && token) {
      const [userRes, reposRes, eventsRes] = await Promise.all([
        axios.get('https://api.github.com/user', {
          headers: { Authorization: `token ${token}` },
          timeout: 15_000,
        }),
        axios.get(
          'https://api.github.com/user/repos?sort=updated&per_page=12',
          {
            headers: { Authorization: `token ${token}` },
            timeout: 15_000,
          },
        ),
        axios.get('https://api.github.com/user/events/public?per_page=50', {
          headers: { Authorization: `token ${token}` },
          timeout: 15_000,
          validateStatus: () => true,
        }),
      ]);

      let pinnedRepos: Array<Record<string, unknown>> = [];
      let totalContributions = 0;
      try {
        const graphRes = await axios.post(
          'https://api.github.com/graphql',
          {
            query: `
              query ImportPinned {
                viewer {
                  contributionsCollection {
                    contributionCalendar { totalContributions }
                  }
                  pinnedItems(first: 6, types: REPOSITORY) {
                    nodes {
                      ... on Repository {
                        name
                        description
                        url
                        primaryLanguage { name }
                      }
                    }
                  }
                }
              }
            `,
          },
          {
            headers: { Authorization: `bearer ${token}` },
            timeout: 15_000,
          },
        );
        const viewer = graphRes.data?.data?.viewer;
        totalContributions = Number(
          viewer?.contributionsCollection?.contributionCalendar
            ?.totalContributions ?? 0,
        );
        const nodes = viewer?.pinnedItems?.nodes;
        if (Array.isArray(nodes)) {
          pinnedRepos = nodes.filter((node: unknown) => !!node) as Array<
            Record<string, unknown>
          >;
        }
      } catch {
        // pinned repo enrichment is optional
      }

      const repos = reposRes.data as Array<Record<string, unknown>>;
      const events = Array.isArray(eventsRes.data)
        ? (eventsRes.data as Array<Record<string, unknown>>)
        : [];
      const contributionsByRepo = new Map<string, number>();
      for (const event of events) {
        if (this.text(event.type) !== 'PushEvent') continue;
        const repo = this.asRecord(event.repo);
        const repoName = this.text(repo.name).split('/').pop() ?? '';
        if (!repoName) continue;
        contributionsByRepo.set(
          repoName,
          (contributionsByRepo.get(repoName) ?? 0) + 1,
        );
      }

      const pinnedProjects = pinnedRepos.map((repo) => ({
        name: this.text(repo.name) || 'Pinned Repository',
        description: this.text(repo.description) || 'Pinned repository',
        url: this.text(repo.url) || undefined,
      }));
      const repoProjects = repos.slice(0, 10).map((repo) => {
        const repoName = this.text(repo.name) || 'Repository';
        const pushes = contributionsByRepo.get(repoName) ?? 0;
        const contributionHint =
          pushes > 0 ? ` - ${pushes} recent push events` : '';
        return {
          name: repoName,
          description: `${this.text(repo.description) || 'Open-source project'}${contributionHint}`,
          url: this.text(repo.html_url) || undefined,
        };
      });
      const projects = [...pinnedProjects, ...repoProjects]
        .filter(
          (project, index, list) =>
            list.findIndex((item) => item.name === project.name) === index,
        )
        .slice(0, 12);

      const languagesFromRepos = repos
        .map((repo) => this.text(repo.language))
        .filter(Boolean);
      const languagesFromPinned = pinnedRepos
        .map((repo) => this.text(this.asRecord(repo.primaryLanguage).name))
        .filter(Boolean);
      const skills = [
        ...new Set([...languagesFromRepos, ...languagesFromPinned]),
      ];
      const summary = [
        this.text(userRes.data.bio),
        totalContributions > 0
          ? `${totalContributions} contributions in the past year`
          : '',
      ]
        .filter(Boolean)
        .join(' - ');

      return {
        provider,
        name: userRes.data.name ?? userRes.data.login ?? undefined,
        summary: summary || undefined,
        profileImageUrl: userRes.data.avatar_url ?? undefined,
        skills,
        projects,
        certifications: [],
        links: userRes.data.html_url ? { github: userRes.data.html_url } : {},
        raw: {
          user: userRes.data,
          repos: reposRes.data,
          events,
          pinnedRepos,
          totalContributions,
        },
      } satisfies ProviderImportData;
    }

    if (provider === 'upwork' && token) {
      const query = `query ImportProfile { profile { identity { fullName title overview picture location { city country } } skills { nodes { name } } profileRate { amount } } }`;
      const res = await axios.post(
        process.env.UPWORK_GRAPHQL_URL ??
          'https://www.upwork.com/api/graphql/v1',
        { query },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 20_000 },
      );
      const profile = res.data?.data?.profile;
      const name = profile?.identity?.fullName ?? undefined;
      const headline = profile?.identity?.title ?? undefined;
      const summary = profile?.identity?.overview ?? undefined;
      const skills = (
        (profile?.skills?.nodes ?? []) as Array<Record<string, unknown>>
      )
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
        certifications: [],
        links: {},
        raw: res.data,
      } satisfies ProviderImportData;
    }

    const fromFallback = this.asRecord(fallback[provider]);
    const linksFromRecord = this.asRecord(fromFallback.links);
    const normalizedLinks = Object.entries(linksFromRecord).reduce<
      Record<string, string>
    >((acc, [key, value]) => {
      const normalized = this.text(value);
      if (!normalized) return acc;
      acc[key] = normalized;
      return acc;
    }, {});
    const profileUrl = this.text(fromFallback.publicUrl);
    if (profileUrl && !normalizedLinks[provider]) {
      normalizedLinks[provider] = profileUrl;
    }

    return {
      provider,
      name: this.text(fromFallback.name),
      headline: this.text(fromFallback.headline),
      summary: this.text(fromFallback.summary),
      profileImageUrl: this.text(fromFallback.profileImageUrl),
      skills: this.array(fromFallback.skills),
      projects: this.projectArray(fromFallback.projects),
      certifications: this.certificationArray(fromFallback.certifications),
      links: normalizedLinks,
      raw: fromFallback,
    } satisfies ProviderImportData;
  }

  // ─── Provider fetch helpers ──────────────────────────────────────────────

  private async fetchLinkedIn(token: string): Promise<ProviderImportData> {
    // Try OpenID Connect userinfo first (for apps using openid+profile+email scopes).
    // Falls back to v2/me with projection for legacy r_liteprofile apps.
    let name: string | undefined;
    let headline: string | undefined;
    let summary: string | undefined;
    let profileImageUrl: string | undefined;
    let profileId: string | undefined;

    try {
      const oidc = await axios.get<Record<string, unknown>>(
        'https://api.linkedin.com/v2/userinfo',
        { headers: { Authorization: `Bearer ${token}` }, timeout: 15_000 },
      );
      name = this.text(oidc.data.name) || undefined;
      profileImageUrl = this.text(oidc.data.picture) || undefined;
      // OIDC doesn't return headline; attempt v2/me for the headline
    } catch {
      // OIDC endpoint unavailable — use legacy profile endpoint
      try {
        const me = await axios.get<Record<string, unknown>>(
          'https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,localizedHeadline,profilePicture(displayImage~:playableStreams))',
          { headers: { Authorization: `Bearer ${token}` }, timeout: 15_000 },
        );
        const fn = this.asRecord(me.data.firstName);
        const ln = this.asRecord(me.data.lastName);
        const locale = this.text(Object.keys(this.asRecord(fn.localized))[0] ?? '');
        name = [
          this.text((this.asRecord(fn.localized) as Record<string, unknown>)[locale]),
          this.text((this.asRecord(ln.localized) as Record<string, unknown>)[locale]),
        ].filter(Boolean).join(' ') || undefined;
        headline = this.text(me.data.localizedHeadline as string) || undefined;
        profileId = this.text(me.data.id as string) || undefined;
        // Extract picture from playableStreams
        const streams = (this.asRecord(
          this.asRecord(me.data.profilePicture)['displayImage~'],
        ).elements ?? []) as Array<Record<string, unknown>>;
        const largest = streams[streams.length - 1];
        const identifiers = (largest?.identifiers ?? []) as Array<Record<string, unknown>>;
        profileImageUrl = this.text(identifiers[0]?.identifier) || undefined;
      } catch { /* ignore */ }
    }

    // Always try the headline endpoint separately (not in OIDC)
    if (!headline) {
      try {
        const meBasic = await axios.get<Record<string, unknown>>(
          'https://api.linkedin.com/v2/me',
          { headers: { Authorization: `Bearer ${token}` }, timeout: 10_000 },
        );
        if (!name) {
          name = `${this.text(meBasic.data.localizedFirstName)} ${this.text(meBasic.data.localizedLastName)}`.trim() || undefined;
        }
        headline = this.text(meBasic.data.localizedHeadline as string) || undefined;
        profileId = this.text(meBasic.data.id as string) || profileId;
      } catch { /* ignore */ }
    }

    return {
      provider: 'linkedin',
      name,
      headline,
      summary,
      profileImageUrl,
      skills: [],
      projects: [],
      certifications: [],
      links: profileId ? { linkedin: `https://www.linkedin.com/in/${profileId}` } : {},
      raw: { name, headline, profileId, profileImageUrl },
    };
  }

  private async fetchFigma(token: string): Promise<ProviderImportData> {
    const meRes = await axios.get<Record<string, unknown>>(
      'https://api.figma.com/v1/me',
      { headers: { 'X-Figma-Token': token }, timeout: 15_000 },
    );
    const handle = this.text(meRes.data.handle);
    const name = this.text(meRes.data.name) || undefined;
    const profileImageUrl = this.text(meRes.data.img_url) || undefined;
    const profileUrl = handle ? `https://www.figma.com/@${handle}` : undefined;

    // Attempt to list the user's draft files (may not be available on all plans)
    let projects: ProviderImportData['projects'] = [];
    try {
      const filesRes = await axios.get<Record<string, unknown>>(
        'https://api.figma.com/v1/me/files?page_size=12',
        { headers: { 'X-Figma-Token': token }, timeout: 15_000 },
      );
      const files = (filesRes.data.files ?? []) as Array<Record<string, unknown>>;
      projects = files.slice(0, 12).map((file) => ({
        name: this.text(file.name) || 'Figma File',
        description: 'Figma design file',
        url: file.key ? `https://www.figma.com/file/${this.text(file.key)}` : undefined,
        imageUrl: this.text(file.thumbnail_url) || undefined,
      }));
    } catch { /* files endpoint may 403 for non-Enterprise — safe to ignore */ }

    return {
      provider: 'figma',
      name,
      profileImageUrl,
      skills: ['Figma', 'UI Design', 'Prototyping'],
      projects,
      certifications: [],
      links: profileUrl ? { figma: profileUrl } : {},
      raw: meRes.data,
    };
  }

  private async fetchDribbble(token: string): Promise<ProviderImportData> {
    const [userRes, shotsRes] = await Promise.all([
      axios.get<Record<string, unknown>>(
        'https://api.dribbble.com/v2/user',
        { headers: { Authorization: `Bearer ${token}` }, timeout: 15_000 },
      ),
      axios.get<Array<Record<string, unknown>>>(
        'https://api.dribbble.com/v2/user/shots?per_page=12',
        { headers: { Authorization: `Bearer ${token}` }, timeout: 15_000 },
      ).catch(() => ({ data: [] as Array<Record<string, unknown>> })),
    ]);

    const user = userRes.data;
    const shots = shotsRes.data;

    const projects: ProviderImportData['projects'] = shots.map((shot) => {
      const images = this.asRecord(shot.images);
      const imageUrl = this.text(images.hidpi) || this.text(images.normal) || undefined;
      return {
        name: this.text(shot.title) || 'Dribbble Shot',
        description: this.text(shot.description).replace(/<[^>]+>/g, '').slice(0, 200) || 'Dribbble design shot',
        url: this.text(shot.html_url) || undefined,
        imageUrl,
        tags: (Array.isArray(shot.tags) ? shot.tags : []).map((t: unknown) => this.text(t)).filter(Boolean).slice(0, 6),
      };
    });

    return {
      provider: 'dribbble',
      name: this.text(user.name) || undefined,
      summary: this.text(user.bio) || undefined,
      profileImageUrl: this.text(this.asRecord(user.avatar_urls).medium) || this.text(user.avatar_url as string) || undefined,
      skills: ['UI Design', 'Visual Design', 'Illustration'],
      projects,
      certifications: [],
      links: user.html_url ? { dribbble: this.text(user.html_url as string) } : {},
      raw: { user, shots },
    };
  }

  private async fetchCanva(token: string): Promise<ProviderImportData> {
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const meRes = await axios.get<Record<string, unknown>>(
      'https://api.canva.com/rest/v1/users/me',
      { headers, timeout: 15_000 },
    );
    const profile = this.asRecord(meRes.data.profile ?? meRes.data);
    const displayName = this.text(profile.display_name) || undefined;
    const profileImageUrl = this.text(profile.avatar_url) || undefined;

    let projects: ProviderImportData['projects'] = [];
    try {
      const designsRes = await axios.get<Record<string, unknown>>(
        'https://api.canva.com/rest/v1/designs?ownership=owned&limit=12',
        { headers, timeout: 20_000 },
      );
      const designs = (designsRes.data.items ?? []) as Array<Record<string, unknown>>;
      projects = designs.map((design) => {
        const thumbnail = this.asRecord(design.thumbnail);
        return {
          name: this.text(design.title) || 'Canva Design',
          description: `Canva design — ${this.text(design.design_type) || 'graphic'}`,
          url: this.text(design.view_url) || this.text(design.urls?.view_url as string) || undefined,
          imageUrl: this.text(thumbnail.url) || undefined,
        };
      });
    } catch { /* designs endpoint may 403 without proper scope */ }

    return {
      provider: 'canva',
      name: displayName,
      profileImageUrl,
      skills: ['Canva', 'Graphic Design', 'Visual Communication'],
      projects,
      certifications: [],
      links: {},
      raw: meRes.data,
    };
  }

  // ─── Merge ──────────────────────────────────────────────────────────────

  private async mergeAndGenerateAbout(
    imported: ProviderImportData[],
    persona: string,
    location?: string,
    focusQuestion?: string,
  ): Promise<MergedProfilePayload> {
    const linkedin = imported.find((item) => item.provider === 'linkedin');
    const upwork = imported.find((item) => item.provider === 'upwork');
    const github = imported.find((item) => item.provider === 'github');
    const firstNamed = imported.find((item) => !!item.name)?.name;
    const firstHeadline = imported.find((item) => !!item.headline)?.headline;
    const summaryFromProviders = imported
      .map((item) => item.summary)
      .filter((value): value is string => !!value && value.trim().length > 0);
    const skills = [
      ...new Set(
        imported.flatMap((item) =>
          item.skills.map((skill) => skill.trim()).filter(Boolean),
        ),
      ),
    ].slice(0, 20);
    const name =
      linkedin?.name ||
      upwork?.name ||
      github?.name ||
      firstNamed ||
      'Portfolio Owner';
    const headline =
      linkedin?.headline ||
      upwork?.headline ||
      github?.headline ||
      firstHeadline ||
      `${persona} portfolio`;
    const whatTheyDo =
      [headline, upwork?.headline].filter(Boolean).join(' | ') || headline;
    const projects = imported
      .flatMap((item) =>
        item.projects.map((project) => ({ ...project, source: item.provider })),
      )
      .filter(
        (project) =>
          project.source === 'github' ||
          project.source === 'behance' ||
          project.source === 'figma' ||
          project.source === 'dribbble' ||
          project.source === 'canva',
      )
      .slice(0, 12);
    const certifications = imported
      .flatMap((item) =>
        item.certifications.map((certification) => ({
          ...certification,
          source: item.provider,
        })),
      )
      .slice(0, 12);
    const links = imported.reduce<Record<string, string>>(
      (acc, item) => ({ ...acc, ...item.links }),
      {},
    );
    const summaryText = [...summaryFromProviders, skills.join(', ')]
      .filter(Boolean)
      .join('\n');

    const linkedinSummary = linkedin?.summary?.trim() ?? '';
    const upworkOverview = upwork?.summary?.trim() ?? '';
    const githubBio = github?.bio?.trim() ?? '';
    const rawBio = [linkedinSummary, upworkOverview, githubBio, summaryText].filter(Boolean).join('\n\n---\n\n');
    const certList = certifications.map((item) => item.title).filter(Boolean).join(', ');
    const projectList = merged.projects?.slice(0, 4).map((p) => p.name || p.title).filter(Boolean).join(', ') ?? '';

    const prompt = [
      `You are a world-class personal branding copywriter. Transform the professional data below into a premium, SEO-optimised About section for ${name}'s portfolio website.`,
      '',
      'WRITING RULES:',
      '- First-person voice, confident and specific — never use clichés like "passionate", "guru", "ninja", "rockstar"',
      '- Lead with impact or a distinctive professional identity statement',
      '- Weave in real skills, actual projects, and specific expertise — not generic claims',
      '- Include a subtle forward-looking statement (what they are working on or seeking)',
      `- Tone: ${this.personaTone(persona)} — match the persona exactly`,
      '- Length: 180–250 words. Dense with value, not fluff.',
      '- Output ONLY the final About section text — no labels, no headings, no explanations',
      '',
      '--- PROFESSIONAL DATA ---',
      `Name: ${name}`,
      `Professional headline: ${headline}`,
      `What they do: ${whatTheyDo}`,
      ...(location ? [`Location: ${location}`] : []),
      ...(focusQuestion ? [`Career focus / target: ${focusQuestion}`] : []),
      `Core skills: ${skills.join(', ')}`,
      ...(certList ? [`Certifications: ${certList}`] : []),
      ...(projectList ? [`Notable projects: ${projectList}`] : []),
      ...(rawBio ? [`Raw bio data to refine:\n${rawBio.slice(0, 1200)}`] : []),
      '--- END DATA ---',
      '',
      'Now write the About section:',
    ].join('\n');

    const about = await this.generateAbout(prompt, name, headline, skills);
    const seoKeywords = this.seoKeywords(
      headline,
      skills,
      location,
      focusQuestion,
    );
    const conflicts = this.conflicts({ linkedin, upwork, github });

    return {
      name,
      headline,
      whatTheyDo,
      about,
      bio: about,
      skills,
      projects,
      certifications,
      links,
      location,
      persona,
      profileImageUrl:
        linkedin?.profileImageUrl ||
        github?.profileImageUrl ||
        upwork?.profileImageUrl ||
        imported.find((item) => !!item.profileImageUrl)?.profileImageUrl ||
        undefined,
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
      contact: {
        body: Object.entries(merged.links)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | '),
      },
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

  private async generateAbout(
    prompt: string,
    name: string,
    headline: string,
    skills: string[],
  ) {
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
      const normalized = personalSiteUrl.startsWith('http')
        ? personalSiteUrl
        : `https://${personalSiteUrl}`;
      const direct = new URL('/favicon.ico', normalized).toString();
      const headRes = await axios.get(direct, {
        timeout: 5_000,
        validateStatus: () => true,
      });
      if (headRes.status >= 200 && headRes.status < 400) return direct;
      const page = await axios.get(normalized, { timeout: 8_000 });
      const html = typeof page.data === 'string' ? page.data : '';
      const match = html.match(
        /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
      );
      if (match?.[1]) return new URL(match[1], normalized).toString();
      return `https://www.google.com/s2/favicons?domain=${new URL(normalized).host}&sz=128`;
    } catch {
      return undefined;
    }
  }

  private async saveSnapshot(
    runId: string,
    userId: string,
    provider: string,
    raw: unknown,
    normalized: unknown,
  ) {
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

  private async updateRun(
    runId: string,
    patch: Prisma.ProfileImportRunUpdateInput,
  ) {
    await this.prisma.profileImportRun.update({
      where: { id: runId },
      data: patch,
    });
  }

  private autoFillScore(merged: MergedProfilePayload) {
    const hasProjects = (merged.projects ?? []).length >= 2;
    const hasCertifications = (merged.certifications ?? []).length > 0;
    const checks = [
      !!merged.name,
      !!merged.headline,
      !!merged.about && merged.about.length > 120,
      (merged.skills ?? []).length >= 6,
      hasProjects || hasCertifications,
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

  private seoKeywords(
    headline: string,
    skills: string[],
    location?: string,
    focusQuestion?: string,
  ) {
    const tokens = [
      ...headline.split(/\s+/),
      ...skills,
      location ?? '',
      focusQuestion ?? '',
    ]
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 2);
    const unique: string[] = [];
    for (const token of tokens) {
      if (unique.includes(token)) continue;
      unique.push(token);
      if (unique.length >= 14) break;
    }
    if (location && skills[0])
      unique.push(`${skills[0].toLowerCase()} ${location.toLowerCase()}`);
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
    if (
      new Set(nameCandidates.map((item) => item.value.toLowerCase())).size > 1
    ) {
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
    if (
      new Set(headlineCandidates.map((item) => item.value.toLowerCase())).size >
      1
    ) {
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
    if (value && typeof value === 'object' && !Array.isArray(value))
      return value as Record<string, unknown>;
    return {};
  }

  private text(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
  }

  private array(value: unknown) {
    if (Array.isArray(value))
      return value.map((item) => this.text(item)).filter(Boolean);
    if (typeof value === 'string')
      return value
        .split(/[\\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean);
    return [] as string[];
  }

  private projectArray(value: unknown) {
    if (!Array.isArray(value)) return [] as ProviderImportData['projects'];

    return value
      .map((item) => this.asRecord(item))
      .map((row) => {
        const name = this.text(row.name) || this.text(row.title);
        if (!name) return null;
        return {
          name,
          description:
            this.text(row.description) ||
            this.text(row.summary) ||
            'Project contribution',
          url: this.text(row.url) || undefined,
          imageUrl: this.text(row.imageUrl) || undefined,
          tags: this.array(row.tags).slice(0, 8),
          caseStudy: this.text(row.caseStudy) || undefined,
        };
      })
      .filter((item): item is NonNullable<typeof item> => !!item)
      .slice(0, 12);
  }

  private certificationArray(value: unknown) {
    if (!Array.isArray(value))
      return [] as ProviderImportData['certifications'];

    return value
      .map((item) => this.asRecord(item))
      .map((row) => {
        const title = this.text(row.title) || this.text(row.name);
        if (!title) return null;
        return {
          title,
          issuer: this.text(row.issuer) || undefined,
          completedAt:
            this.text(row.completedAt) || this.text(row.date) || undefined,
          imageUrl: this.text(row.imageUrl) || undefined,
          proofUrl: this.text(row.proofUrl) || undefined,
          proofName: this.text(row.proofName) || undefined,
        };
      })
      .filter((item): item is NonNullable<typeof item> => !!item)
      .slice(0, 12);
  }

  private toErr(value: unknown) {
    if (value instanceof Error) return value.message;
    if (typeof value === 'string') return value;
    return 'Unknown error';
  }

  private slugify(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
  }
}
