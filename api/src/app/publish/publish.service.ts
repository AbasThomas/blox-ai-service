import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

const APP_HOST = (() => {
  const raw = process.env.APP_BASE_URL ?? 'https://blox.app';
  try {
    return new URL(raw).host;
  } catch {
    return raw.replace(/https?:\/\//, '').replace(/\/.*$/, '');
  }
})();
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
    const asset = await this.prisma.asset.findFirst({ where: { id: assetId, userId } });
    if (!asset) throw new NotFoundException('Asset not found');

    const slug = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!slug || RESERVED_SUBDOMAINS.has(slug)) {
      throw new BadRequestException('This subdomain is reserved');
    }

    // Check subdomain uniqueness (excluding own asset)
    const existing = await this.prisma.publishTarget.findFirst({
      where: { subdomain: slug, asset: { userId: { not: userId } } },
    });
    if (existing) throw new BadRequestException('Subdomain is already taken');

    const target = await this.prisma.publishTarget.upsert({
      where: { id: (await this.prisma.publishTarget.findFirst({ where: { assetId } }))?.id ?? 'new' },
      create: { assetId, subdomain: slug, customDomain: customDomain ?? null, isActive: false },
      update: { subdomain: slug, customDomain: customDomain ?? null },
    });

    await this.publishQueue.add(
      'publish',
      { assetId, userId, subdomain: slug, customDomain, targetId: target.id },
      scheduleAt ? { delay: new Date(scheduleAt).getTime() - Date.now() } : {},
    );

    const publishedUrl = `https://${slug}.${APP_HOST}`;

    await this.prisma.asset.update({
      where: { id: assetId },
      data: { publishedUrl, slug, visibility: 'PUBLIC' },
    });

    return {
      status: scheduleAt ? 'scheduled' : 'publishing',
      assetId,
      publishedUrl,
      subdomain: slug,
      customDomain: customDomain ?? null,
      scheduleAt: scheduleAt ?? new Date().toISOString(),
      sitemapUrl: `${publishedUrl}/sitemap.xml`,
      robotsUrl: `${publishedUrl}/robots.txt`,
    };
  }

  async unpublish(userId: string, assetId: string) {
    const asset = await this.prisma.asset.findFirst({ where: { id: assetId, userId } });
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
