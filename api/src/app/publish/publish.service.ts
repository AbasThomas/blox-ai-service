import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

const APP_BASE_URL = process.env.APP_BASE_URL ?? 'https://blox.app';

const APP_BASE = (() => {
  try {
    return new URL(APP_BASE_URL);
  } catch {
    return new URL(
      APP_BASE_URL.startsWith('http')
        ? APP_BASE_URL
        : `https://${APP_BASE_URL}`,
    );
  }
})();

function isLocalHostname(hostname: string) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.localhost')
  );
}

function buildPublishedUrls(subdomain: string) {
  if (isLocalHostname(APP_BASE.hostname)) {
    const baseOrigin = `${APP_BASE.protocol}//${APP_BASE.host}`;
    const publishedUrl = `${baseOrigin}/${subdomain}`;
    return {
      publishedUrl,
      sitemapUrl: `${publishedUrl}/sitemap.xml`,
      robotsUrl: `${publishedUrl}/robots.txt`,
    };
  }

  const publishedUrl = `${APP_BASE.protocol}//${subdomain}.${APP_BASE.host}`;
  return {
    publishedUrl,
    sitemapUrl: `${publishedUrl}/sitemap.xml`,
    robotsUrl: `${publishedUrl}/robots.txt`,
  };
}

const RESERVED_SUBDOMAINS = new Set([
  'dashboard',
  'signup',
  'login',
  'settings',
  'templates',
  'scanner',
  'marketplace',
  'help',
  'pricing',
  'api',
  'www',
]);

@Injectable()
export class PublishService {
  private readonly logger = new Logger(PublishService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('publish') private readonly publishQueue: Queue,
  ) {}

  async publish(
    userId: string,
    assetId: string,
    subdomain: string,
    customDomain?: string,
    scheduleAt?: string,
  ) {
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, userId },
    });
    if (!asset) throw new NotFoundException('Asset not found');

    const slug = subdomain
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (!slug || RESERVED_SUBDOMAINS.has(slug)) {
      throw new BadRequestException('This subdomain is reserved');
    }

    // Check subdomain uniqueness (excluding own asset)
    const existing = await this.prisma.publishTarget.findFirst({
      where: { subdomain: slug, asset: { userId: { not: userId } } },
    });
    if (existing) throw new BadRequestException('Subdomain is already taken');

    const existingTarget = await this.prisma.publishTarget.findFirst({
      where: { assetId },
      select: { id: true },
    });

    const scheduled =
      typeof scheduleAt === 'string' &&
      Number.isFinite(new Date(scheduleAt).getTime()) &&
      new Date(scheduleAt).getTime() > Date.now();

    const target = existingTarget
      ? await this.prisma.publishTarget.update({
          where: { id: existingTarget.id },
          data: {
            subdomain: slug,
            customDomain: customDomain ?? null,
            ...(scheduled
              ? { isActive: false, publishedAt: null }
              : {
                  isActive: true,
                  publishedAt: new Date(),
                  sslProvisioned: !isLocalHostname(APP_BASE.hostname),
                }),
          },
        })
      : await this.prisma.publishTarget.create({
          data: {
            assetId,
            subdomain: slug,
            customDomain: customDomain ?? null,
            isActive: !scheduled,
            publishedAt: scheduled ? null : new Date(),
            sslProvisioned: !isLocalHostname(APP_BASE.hostname),
          },
        });

    const urls = buildPublishedUrls(slug);

    await this.prisma.asset.update({
      where: { id: assetId },
      data: {
        publishedUrl: urls.publishedUrl,
        slug,
        visibility: scheduled ? asset.visibility : 'PUBLIC',
      },
    });

    const publishJobPayload = {
      assetId,
      userId,
      subdomain: slug,
      customDomain,
      targetId: target.id,
    };
    if (scheduled) {
      const delay = Math.max(
        0,
        new Date(scheduleAt as string).getTime() - Date.now(),
      );
      await this.publishQueue.add('publish', publishJobPayload, { delay });
    } else {
      // Best-effort async job for notifications and downstream side effects.
      this.publishQueue
        .add('publish', publishJobPayload)
        .catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'Unknown queue error';
          this.logger.warn(
            `Publish queue unavailable. Portfolio is still live: ${message}`,
          );
        });
    }

    return {
      status: scheduled ? 'scheduled' : 'published',
      assetId,
      publishedUrl: urls.publishedUrl,
      subdomain: slug,
      customDomain: customDomain ?? null,
      scheduleAt: scheduleAt ?? new Date().toISOString(),
      sitemapUrl: urls.sitemapUrl,
      robotsUrl: urls.robotsUrl,
    };
  }

  async unpublish(userId: string, assetId: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, userId },
    });
    if (!asset) throw new NotFoundException('Asset not found');

    await this.prisma.publishTarget.updateMany({
      where: { assetId },
      data: { isActive: false },
    });

    await this.prisma.asset.update({
      where: { id: assetId },
      data: { publishedUrl: null, visibility: 'PRIVATE' },
    });

    return { unpublished: true };
  }

  async getStatus(userId: string, assetId: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, userId },
      include: { publishTargets: true },
    });
    if (!asset) throw new NotFoundException('Asset not found');
    return { asset, publishTargets: asset.publishTargets };
  }
}
