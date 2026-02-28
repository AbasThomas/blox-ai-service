import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:3334';

@Processor('asset-critique')
export class AssetCritiqueProcessor extends WorkerHost {
  private readonly logger = new Logger(AssetCritiqueProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ assetId: string; userId: string }>) {
    const { assetId, userId } = job.data;
    this.logger.log(`[asset-critique] Job ${job.id} for asset ${assetId}`);

    const asset = await this.prisma.asset.findFirst({ where: { id: assetId, userId } });
    if (!asset) throw new Error('Asset not found');

    const contentStr = JSON.stringify(asset.content);
    const contentLength = contentStr.length;

    let critiqueText = '';
    try {
      const res = await axios.post<{ content: string }>(
        `${AI_SERVICE_URL}/v1/ai/generate`,
        {
          prompt: `Critique this professional ${asset.type} content and provide specific improvement suggestions:\n${contentStr.substring(0, 2000)}`,
          preferredRoute: 'generation_critique',
        },
        { timeout: 90_000 },
      );
      critiqueText = res.data.content;
    } catch {
      this.logger.warn('[asset-critique] AI service unavailable, using algorithmic critique');
    }

    // Algorithmic scoring
    const sections = ((asset.content as Record<string, unknown>).sections as unknown[]) ?? [];
    const filledSections = sections.filter((s) => JSON.stringify(s).length > 50);
    const completeness = Math.round((filledSections.length / Math.max(sections.length, 1)) * 100);

    const readability = Math.min(95, Math.round(50 + contentLength / 500));
    const ats = Math.min(95, Math.round(55 + (completeness * 0.4)));
    const seo = Math.min(90, Math.round(45 + contentLength / 600));
    const overall = Math.round((readability + ats + seo + completeness) / 4);

    const critique = {
      overallScore: overall,
      readability,
      ats,
      seo,
      completeness,
      aiSuggestions: critiqueText || null,
      improvements: [
        completeness < 70 && 'Fill in all sections for a complete profile',
        readability < 70 && 'Use shorter, more impactful sentences',
        ats < 70 && 'Add industry-standard keywords and section headings',
        seo < 70 && 'Include target keywords in your summary',
      ].filter(Boolean),
      critiqueGeneratedAt: new Date().toISOString(),
    };

    await this.prisma.asset.update({
      where: { id: assetId },
      data: {
        healthScore: overall,
        content: { ...(asset.content as object), critique },
      },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'critique_ready',
        title: `Critique complete — Score: ${overall}/100`,
        payload: { assetId, score: overall },
      },
    });

    this.logger.log(`[asset-critique] Completed for ${assetId}, score: ${overall}`);
    return { assetId, score: overall };
  }
}
