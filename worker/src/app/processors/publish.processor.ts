import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Processor('publish')
export class PublishProcessor extends WorkerHost {
  private readonly logger = new Logger(PublishProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(
    job: Job<{ assetId: string; userId: string; subdomain: string; customDomain?: string; targetId: string }>,
  ) {
    const { assetId, userId, subdomain, targetId } = job.data;
    this.logger.log(`[publish] Job ${job.id} for ${subdomain}.blox.app`);

    try {
      // Update publish target as active
      await this.prisma.publishTarget.update({
        where: { id: targetId },
        data: { isActive: true, publishedAt: new Date(), sslProvisioned: true },
      });

      // Update asset visibility to public
      await this.prisma.asset.update({
        where: { id: assetId },
        data: { visibility: 'PUBLIC' },
      });

      // Notify user
      const appHost = (process.env.APP_BASE_URL ?? 'https://blox.app').replace(/https?:\/\//, '');
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'asset_published',
          title: 'Your portfolio is live!',
          payload: { assetId, subdomain, url: `https://${subdomain}.${appHost}` },
        },
      });

      this.logger.log(`[publish] Published ${subdomain}.blox.app`);
      return { assetId, subdomain, status: 'published', publishedAt: new Date().toISOString() };
    } catch (err) {
      this.logger.error(`[publish] Failed for ${assetId}`, err);
      throw err;
    }
  }
}

