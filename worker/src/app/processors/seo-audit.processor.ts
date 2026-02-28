import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Processor('seo-audit')
export class SeoAuditProcessor extends WorkerHost {
  private readonly logger = new Logger(SeoAuditProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ assetId: string; userId: string }>) {
    const { assetId, userId } = job.data;
    this.logger.log(`[seo-audit] Job ${job.id} for asset ${assetId}`);

    const asset = await this.prisma.asset.findFirst({ where: { id: assetId, userId } });
    if (!asset) throw new Error('Asset not found');

    const seoConfig = (asset.seoConfig as Record<string, unknown>) ?? {};
    const title = (seoConfig.title as string) ?? asset.title;
    const description = (seoConfig.description as string) ?? '';
    const keywords = (seoConfig.keywords as string[]) ?? [];
    const contentStr = JSON.stringify(asset.content);

    const checks = [
      { key: 'title_length', label: 'Title is 50-60 characters', weight: 20, passed: title.length >= 30 && title.length <= 70, current: `${title.length} chars` },
      { key: 'description', label: 'Has meta description (120-160 chars)', weight: 20, passed: description.length >= 80 && description.length <= 200, current: `${description.length} chars` },
      { key: 'has_keywords', label: 'Has target keywords defined', weight: 15, passed: keywords.length >= 3, current: `${keywords.length} keywords` },
      { key: 'content_length', label: 'Sufficient content (500+ chars)', weight: 20, passed: contentStr.length > 500, current: `${contentStr.length} chars` },
      { key: 'has_og_image', label: 'Has Open Graph image', weight: 15, passed: !!(seoConfig.ogImage), current: seoConfig.ogImage ? 'set' : 'missing' },
      { key: 'structured_data', label: 'Has structured data hints', weight: 10, passed: !!(seoConfig.structuredData), current: seoConfig.structuredData ? 'set' : 'missing' },
    ];

    let score = 0;
    const suggestions: string[] = [];
    for (const check of checks) {
      if (check.passed) score += check.weight;
      else suggestions.push(`Improve ${check.label} (current: ${check.current})`);
    }

    const updatedSeoConfig = {
      ...seoConfig,
      auditScore: score,
      auditChecks: checks,
      auditSuggestions: suggestions,
      auditedAt: new Date().toISOString(),
    };

    await this.prisma.asset.update({
      where: { id: assetId },
      data: { seoConfig: updatedSeoConfig as Prisma.InputJsonValue },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'seo_audit_ready',
        title: `SEO Audit complete — Score: ${score}/100`,
        payload: { assetId, score, suggestions: suggestions.length },
      },
    });

    return { assetId, seoScore: score, checks, suggestions };
  }
}
