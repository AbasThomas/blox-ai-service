import { Injectable, NotFoundException } from '@nestjs/common';
import { AiJobResult, AssetType, SeoSuggestionPayload, Visibility } from '@nextjs-blox/shared-types';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:3334';

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('asset-generate') private readonly generateQueue: Queue,
    @InjectQueue('asset-duplicate') private readonly duplicateQueue: Queue,
  ) {}

  async list(userId: string, type?: AssetType) {
    return this.prisma.asset.findMany({
      where: { userId, ...(type ? { type } : {}) },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        type: true,
        title: true,
        slug: true,
        healthScore: true,
        visibility: true,
        publishedUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(userId: string, type: AssetType, title: string, templateId?: string) {
    const asset = await this.prisma.asset.create({
      data: {
        userId,
        type,
        title,
        slug: this.slugify(title),
        content: { sections: [], generatingStatus: 'idle', templateId: templateId ?? null },
        healthScore: 0,
        visibility: 'PRIVATE',
      },
    });

    await this.prisma.assetVersion.create({
      data: {
        assetId: asset.id,
        versionLabel: 'v1.0',
        branchName: 'main',
        content: asset.content as Prisma.InputJsonValue,
        createdBy: userId,
      },
    });

    return asset;
  }

  async getById(userId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, userId },
      include: { publishTargets: { where: { isActive: true } } },
    });
    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  async update(
    userId: string,
    id: string,
    patch: {
      title?: string;
      content?: Record<string, unknown>;
      visibility?: Visibility;
      seoConfig?: Record<string, unknown>;
    },
  ) {
    const asset = await this.getById(userId, id);

    const updated = await this.prisma.asset.update({
      where: { id: asset.id },
      data: {
        ...(patch.title !== undefined && { title: patch.title }),
        ...(patch.content !== undefined && {
          content: patch.content as Prisma.InputJsonValue,
          healthScore: this.calculateHealthScore(patch.content),
        }),
        ...(patch.visibility !== undefined && { visibility: patch.visibility as 'PUBLIC' | 'PRIVATE' | 'PASSWORD' | 'TIME_LIMITED' }),
        ...(patch.seoConfig !== undefined && { seoConfig: patch.seoConfig as Prisma.InputJsonValue }),
      },
    });

    return updated;
  }

  async suggestSeo(userId: string, id: string): Promise<SeoSuggestionPayload> {
    const asset = await this.prisma.asset.findFirst({
      where: { id, userId },
      include: { user: { select: { fullName: true } } },
    });
    if (!asset) throw new NotFoundException('Asset not found');

    const existingSeo = this.asRecord(asset.seoConfig);
    const contentText = this.flattenContent(asset.content);
    const aiSuggestion = await this.tryAiSeoSuggestion({
      title: asset.title,
      type: asset.type,
      fullName: asset.user.fullName,
      contentText,
    });

    const suggestedKeywords = aiSuggestion?.keywords?.length
      ? aiSuggestion.keywords
      : this.extractKeywords([asset.title, asset.user.fullName, contentText].join(' '));

    const suggestion: SeoSuggestionPayload = {
      title:
        aiSuggestion?.title?.trim() ||
        `${asset.user.fullName} | ${asset.title}`.slice(0, 60),
      description:
        aiSuggestion?.description?.trim() ||
        this.toDescription(contentText, asset.user.fullName),
      keywords: suggestedKeywords.slice(0, 12),
      ogImagePrompt:
        aiSuggestion?.ogImagePrompt?.trim() ||
        `Professional hero banner for ${asset.user.fullName}, modern portfolio, clean typography, brand-safe composition.`,
      imageAltMap: {
        hero: `${asset.user.fullName} portfolio hero image`,
        avatar: `Portrait of ${asset.user.fullName}`,
        ...(aiSuggestion?.imageAltMap ?? {}),
      },
    };

    const mergedSeo = {
      ...existingSeo,
      title: this.pickExistingOrFallback(existingSeo.title, suggestion.title),
      description: this.pickExistingOrFallback(existingSeo.description, suggestion.description),
      keywords: Array.isArray(existingSeo.keywords) && existingSeo.keywords.length > 0
        ? existingSeo.keywords
        : suggestion.keywords,
      ogImagePrompt: this.pickExistingOrFallback(existingSeo.ogImagePrompt, suggestion.ogImagePrompt),
      imageAltMap: {
        ...(suggestion.imageAltMap ?? {}),
        ...this.asRecord(existingSeo.imageAltMap),
      },
      suggestionGeneratedAt: new Date().toISOString(),
      suggestedSeo: suggestion,
    };

    await this.prisma.asset.update({
      where: { id: asset.id },
      data: { seoConfig: mergedSeo as Prisma.InputJsonValue },
    });

    return suggestion;
  }

  async generateOgImage(userId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, userId },
      include: { user: { select: { fullName: true } } },
    });
    if (!asset) throw new NotFoundException('Asset not found');

    const seoConfig = this.asRecord(asset.seoConfig);
    const label = asset.user.fullName || asset.title;
    const ogImage = `https://dummyimage.com/1200x630/0f172a/ffffff.png&text=${encodeURIComponent(label)}`;

    await this.prisma.asset.update({
      where: { id: asset.id },
      data: {
        seoConfig: {
          ...seoConfig,
          ogImage,
          ogImageGeneratedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });

    return { ogImage };
  }

  async deleteById(userId: string, id: string) {
    const asset = await this.getById(userId, id);
    await this.prisma.asset.delete({ where: { id: asset.id } });
    return { deleted: true };
  }

  async generate(userId: string, assetId: string, prompt: string) {
    const asset = await this.getById(userId, assetId);

    await this.prisma.asset.update({
      where: { id: asset.id },
      data: { content: { ...(asset.content as object), generatingStatus: 'queued' } as Prisma.InputJsonValue },
    });

    const job = await this.generateQueue.add('generate', {
      assetId: asset.id,
      type: asset.type,
      prompt,
      userId,
    });

    return { jobId: job.id, status: 'queued' };
  }

  async duplicateForJob(userId: string, id: string, jobDescription?: string) {
    const existing = await this.getById(userId, id);

    const copy = await this.create(
      userId,
      existing.type,
      `${existing.title} (Tailored)`,
    );

    await this.prisma.asset.update({
      where: { id: copy.id },
      data: { content: existing.content as Prisma.InputJsonValue },
    });

    if (jobDescription) {
      await this.duplicateQueue.add('duplicate', {
        sourceAssetId: existing.id,
        targetAssetId: copy.id,
        jobDescription,
        userId,
      });
    }

    return copy;
  }

  async listVersions(userId: string, assetId: string) {
    await this.getById(userId, assetId);
    return this.prisma.assetVersion.findMany({
      where: { assetId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async saveVersion(userId: string, assetId: string, label: string, branch?: string) {
    const asset = await this.getById(userId, assetId);
    return this.prisma.assetVersion.create({
      data: {
        assetId: asset.id,
        versionLabel: label,
        branchName: branch ?? 'main',
        content: asset.content as Prisma.InputJsonValue,
        createdBy: userId,
      },
    });
  }

  async restoreVersion(userId: string, assetId: string, versionId: string) {
    const asset = await this.getById(userId, assetId);
    const version = await this.prisma.assetVersion.findFirst({
      where: { id: versionId, assetId: asset.id },
    });
    if (!version) throw new NotFoundException('Version not found');

    return this.prisma.asset.update({
      where: { id: asset.id },
      data: { content: version.content as Prisma.InputJsonValue },
    });
  }

  tierLimits() {
    return {
      FREE: { assets: 3, templates: 5, bulkScanner: false, export: true, collaborate: false },
      PRO: { assets: 25, templates: 500, bulkScanner: false, export: true, collaborate: true },
      PREMIUM: { assets: -1, templates: -1, bulkScanner: true, export: true, collaborate: true },
      ENTERPRISE: { assets: -1, templates: -1, bulkScanner: true, export: true, collaborate: true },
    };
  }

  private slugify(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 60);
  }

  private calculateHealthScore(content: Record<string, unknown>): number {
    const sections = (content.sections as unknown[]) ?? [];
    if (sections.length === 0) return 0;

    let score = 0;
    const filledSections = sections.filter((s: unknown) => {
      const section = s as Record<string, unknown>;
      return section.content && JSON.stringify(section.content).length > 20;
    });

    score = Math.round((filledSections.length / Math.max(sections.length, 1)) * 100);
    return Math.min(score, 100);
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }

  private flattenContent(value: unknown): string {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map((item) => this.flattenContent(item)).join(' ');
    if (value && typeof value === 'object') {
      return Object.values(value as Record<string, unknown>)
        .map((item) => this.flattenContent(item))
        .join(' ');
    }
    return '';
  }

  private toDescription(content: string, fullName: string): string {
    const normalized = content.replace(/\s+/g, ' ').trim();
    if (!normalized) return `Explore ${fullName}'s portfolio and featured links.`;
    if (normalized.length <= 155) return normalized;
    return `${normalized.slice(0, 154).trimEnd()}...`;
  }

  private extractKeywords(content: string): string[] {
    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'from', 'that', 'this', 'your', 'have', 'has', 'are', 'was',
      'will', 'been', 'into', 'our', 'you', 'about', 'portfolio', 'resume', 'cover', 'letter',
      'section', 'professional', 'experience', 'skills', 'contact',
    ]);

    const words = content
      .toLowerCase()
      .replace(/[^a-z0-9\s+#-]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));

    const freq = new Map<string, number>();
    for (const word of words) {
      freq.set(word, (freq.get(word) ?? 0) + 1);
    }

    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 16)
      .map(([word]) => word);
  }

  private pickExistingOrFallback(existing: unknown, fallback: string): string {
    if (typeof existing === 'string' && existing.trim().length > 0) {
      return existing.trim();
    }
    return fallback;
  }

  private async tryAiSeoSuggestion(input: {
    title: string;
    type: AssetType;
    fullName: string;
    contentText: string;
  }): Promise<Partial<SeoSuggestionPayload> | null> {
    const prompt = [
      'Return strict JSON only.',
      'Keys: title, description, keywords, ogImagePrompt, imageAltMap.',
      'No markdown, no prose, no code fences.',
      `Name: ${input.fullName}`,
      `Asset title: ${input.title}`,
      `Asset type: ${input.type}`,
      `Content excerpt: ${input.contentText.slice(0, 1_400)}`,
    ].join('\n');

    try {
      const response = await axios.post<AiJobResult>(
        `${AI_SERVICE_URL}/v1/ai/generate`,
        {
          assetType: input.type,
          prompt,
          context: {
            title: input.title,
            fullName: input.fullName,
          },
          preferredRoute: 'preview_fast',
        },
        { timeout: 12_000 },
      );

      const raw = response.data?.content;
      if (!raw || typeof raw !== 'string') return null;

      const jsonCandidate = raw.match(/\{[\s\S]*\}/)?.[0];
      if (!jsonCandidate) return null;

      const parsed = JSON.parse(jsonCandidate) as Partial<SeoSuggestionPayload>;
      return {
        title: typeof parsed.title === 'string' ? parsed.title : undefined,
        description: typeof parsed.description === 'string' ? parsed.description : undefined,
        keywords: Array.isArray(parsed.keywords)
          ? parsed.keywords.filter((word): word is string => typeof word === 'string')
          : undefined,
        ogImagePrompt: typeof parsed.ogImagePrompt === 'string' ? parsed.ogImagePrompt : undefined,
        imageAltMap: parsed.imageAltMap && typeof parsed.imageAltMap === 'object'
          ? Object.fromEntries(
              Object.entries(parsed.imageAltMap).filter((entry): entry is [string, string] => {
                return typeof entry[0] === 'string' && typeof entry[1] === 'string';
              }),
            )
          : undefined,
      };
    } catch {
      return null;
    }
  }
}
