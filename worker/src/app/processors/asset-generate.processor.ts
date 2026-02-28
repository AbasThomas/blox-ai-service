import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:3334';

@Processor('asset-generate')
export class AssetGenerateProcessor extends WorkerHost {
  private readonly logger = new Logger(AssetGenerateProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ assetId: string; type: string; prompt: string; userId: string }>) {
    const { assetId, type, prompt, userId } = job.data;
    this.logger.log(`[asset-generate] Job ${job.id} for asset ${assetId}`);

    try {
      // Mark as processing
      await this.prisma.asset.update({
        where: { id: assetId },
        data: { content: { generatingStatus: 'processing' } },
      });

      // Call AI service
      let generatedContent: string;
      try {
        const response = await axios.post<{ content: string }>(
          `${AI_SERVICE_URL}/v1/ai/generate`,
          { prompt: `Generate a ${type} for: ${prompt}`, preferredRoute: 'generation_critique' },
          { timeout: 120_000 },
        );
        generatedContent = response.data.content;
      } catch (err) {
        this.logger.warn('AI service unavailable, using fallback content');
        generatedContent = this.buildFallbackContent(type, prompt);
      }

      // Map to sections
      const sections = this.mapToSections(type, generatedContent);

      // Update asset content
      await this.prisma.asset.update({
        where: { id: assetId },
        data: {
          content: { sections, generatingStatus: 'completed', generatedAt: new Date().toISOString() },
          healthScore: Math.min(sections.length * 12, 95),
        },
      });

      // Create version
      await this.prisma.assetVersion.create({
        data: {
          assetId,
          versionLabel: 'v1.0 (AI Generated)',
          branchName: 'main',
          content: { sections, generatingStatus: 'completed' },
          createdBy: userId,
        },
      });

      // Notify user
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'asset_generated',
          title: 'Your content is ready!',
          payload: { assetId, type },
        },
      });

      this.logger.log(`[asset-generate] Completed for asset ${assetId}`);
      return { assetId, status: 'COMPLETED', sections: sections.length };
    } catch (err) {
      this.logger.error(`[asset-generate] Failed for ${assetId}`, err);
      await this.prisma.asset.update({
        where: { id: assetId },
        data: { content: { generatingStatus: 'failed', error: String(err) } },
      }).catch(() => undefined);
      throw err;
    }
  }

  private mapToSections(type: string, content: string): Array<{ id: string; type: string; content: string }> {
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    const sectionMap: Record<string, string[]> = {
      PORTFOLIO: ['hero', 'about', 'work', 'projects', 'skills', 'contact'],
      RESUME: ['summary', 'experience', 'education', 'skills'],
      COVER_LETTER: ['opening', 'body', 'closing'],
    };

    const sectionTypes = sectionMap[type] ?? sectionMap.RESUME;
    return sectionTypes.map((sectionType, i) => ({
      id: `section-${i}`,
      type: sectionType,
      content: lines[i] ?? `${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} section`,
    }));
  }

  private buildFallbackContent(type: string, prompt: string): string {
    return `Professional ${type} content for: ${prompt}\n\nSummary\nExperienced professional with strong skills.\n\nExperience\nSenior position with key achievements.\n\nSkills\nLeadership, Communication, Technical expertise.\n\nEducation\nRelevant degree and certifications.`;
  }
}

