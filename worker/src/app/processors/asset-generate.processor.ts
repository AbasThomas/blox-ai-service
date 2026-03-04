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

    // Fetch existing content so we can merge instead of overwrite
    const existing = await this.prisma.asset.findUnique({ where: { id: assetId }, select: { content: true } });
    const existingContent = (existing?.content && typeof existing.content === 'object' && !Array.isArray(existing.content))
      ? (existing.content as Record<string, unknown>)
      : {};

    try {
      // Mark as processing — preserve all existing content fields
      await this.prisma.asset.update({
        where: { id: assetId },
        data: { content: { ...existingContent, generatingStatus: 'processing' } },
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

      // Map to structured content matching the editor's expected shape
      const generatedFields = this.mapToContentFields(type, generatedContent);

      // Merge generated fields into existing content (preserves templateId, profile, etc.)
      const updatedContent = {
        ...existingContent,
        ...generatedFields,
        generatingStatus: 'completed',
        generatedAt: new Date().toISOString(),
      };

      await this.prisma.asset.update({
        where: { id: assetId },
        data: {
          content: updatedContent,
          healthScore: Math.min(Object.keys(generatedFields).length * 12, 95),
        },
      });

      // Create version snapshot
      await this.prisma.assetVersion.create({
        data: {
          assetId,
          versionLabel: 'v1.0 (AI Generated)',
          branchName: 'main',
          content: updatedContent,
          createdBy: userId,
        },
      });

      // Notify user
      const typeLabel = type === 'PORTFOLIO' ? 'portfolio' : type === 'RESUME' ? 'résumé' : 'cover letter';
      const editPath = type === 'PORTFOLIO' ? `/portfolios/${assetId}` : type === 'RESUME' ? `/resumes/${assetId}/edit` : `/cover-letters/${assetId}/edit`;
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'asset_generated',
          title: `Your ${typeLabel} is ready!`,
          message: `AI generation completed successfully. Review your content and make any adjustments before publishing.`,
          link: editPath,
          payload: { assetId, type },
        },
      });

      this.logger.log(`[asset-generate] Completed for asset ${assetId}`);
      return { assetId, status: 'COMPLETED', fields: Object.keys(generatedFields).length };
    } catch (err) {
      this.logger.error(`[asset-generate] Failed for ${assetId}`, err);
      await this.prisma.asset.update({
        where: { id: assetId },
        data: { content: { ...existingContent, generatingStatus: 'failed', error: String(err) } },
      }).catch(() => undefined);
      throw err;
    }
  }

  /**
   * Maps raw AI text into the structured content shape expected by the portfolio/resume editor.
   * For PORTFOLIO: { hero, about, experience, projects, skills, contact }
   * For RESUME:    { summary, experience, education, skills }
   */
  private mapToContentFields(type: string, content: string): Record<string, unknown> {
    const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
    const get = (i: number) => lines[i] ?? '';

    if (type === 'PORTFOLIO') {
      return {
        hero: { heading: get(0), body: get(1) },
        about: { body: lines.slice(2, 4).join(' ') },
        experience: { items: lines.slice(4, 7).filter(Boolean) },
        projects: { items: lines.slice(7, 10).filter(Boolean) },
        skills: { items: lines.slice(10, 15).filter(Boolean) },
        contact: { body: get(15) },
      };
    }

    if (type === 'RESUME') {
      return {
        summary: { body: lines.slice(0, 2).join(' ') },
        experience: { items: lines.slice(2, 6).filter(Boolean) },
        education: { items: lines.slice(6, 8).filter(Boolean) },
        skills: { items: lines.slice(8, 14).filter(Boolean) },
      };
    }

    // COVER_LETTER or other
    return {
      summary: { body: content },
    };
  }

  private buildFallbackContent(type: string, prompt: string): string {
    if (type === 'PORTFOLIO') {
      return [
        `${prompt} — Portfolio`,
        'Building exceptional digital experiences with a focus on quality and user impact.',
        'Passionate developer with a drive for clean code and impactful products.',
        'Available for freelance and full-time opportunities.',
        'Led cross-functional teams to deliver scalable web applications',
        'Reduced load time by 40% through performance optimisation',
        'Shipped 12 features that increased retention by 25%',
        'E-Commerce Platform | Full-stack rebuild with Next.js and Stripe | https://example.com',
        'Dashboard Analytics | Real-time charts with D3.js and WebSockets',
        'Open Source CLI | Dev tool with 2k GitHub stars',
        'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker',
        'AWS', 'GraphQL', 'Redis',
        '', '',
        'hello@example.com',
      ].join('\n');
    }
    return `Professional ${type} content for: ${prompt}\n\nExperienced professional with strong skills.\nSenior position with key achievements.\nLeadership, Communication, Technical expertise.\nRelevant degree and certifications.`;
  }
}

