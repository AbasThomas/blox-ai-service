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
    job: Job<{
      assetId: string;
      userId: string;
      subdomain: string;
      customDomain?: string;
      targetId: string;
    }>,
  ) {
    const { assetId, userId, subdomain, targetId } = job.data;
    this.logger.log(`[publish] Job ${job.id} for ${subdomain}.blox.app`);

    try {
      const target = await this.prisma.publishTarget.findUnique({
        where: { id: targetId },
        select: { isActive: true },
      });
      const asset = await this.prisma.asset.findUnique({
        where: { id: assetId },
        select: { visibility: true },
      });
      if (target?.isActive && asset?.visibility === 'PUBLIC') {
        this.logger.log(`[publish] Skip ${assetId}; already active.`);
        return {
          assetId,
          subdomain,
          status: 'published',
          publishedAt: new Date().toISOString(),
        };
      }

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
      const appBase = process.env.APP_BASE_URL ?? 'https://blox.app';
      let appUrl: URL;
      try {
        appUrl = new URL(appBase);
      } catch {
        appUrl = new URL(
          appBase.startsWith('http') ? appBase : `https://${appBase}`,
        );
      }
      const isLocal =
        appUrl.hostname === 'localhost' ||
        appUrl.hostname === '127.0.0.1' ||
        appUrl.hostname.endsWith('.localhost');
      const publishUrl = isLocal
        ? `${appUrl.protocol}//${appUrl.host}/${subdomain}`
        : `${appUrl.protocol}//${subdomain}.${appUrl.host}`;
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'asset_published',
          title: 'Your portfolio is live!',
          payload: { assetId, subdomain, url: publishUrl },
        },
      });

      this.logger.log(`[publish] Published ${subdomain}.blox.app`);
      return {
        assetId,
        subdomain,
        status: 'published',
        publishedAt: new Date().toISOString(),
      };
    } catch (err) {
      this.logger.error(`[publish] Failed for ${assetId}`, err);
      throw err;
    }
  }
}
