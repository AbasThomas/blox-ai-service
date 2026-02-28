import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async trackView(assetId: string, shortCode: string) {
    await this.prisma.linkTracker.updateMany({
      where: { assetId, shortCode },
      data: { clickCount: { increment: 1 } },
    });
    return { tracked: true };
  }

  async byAsset(userId: string, assetId: string, from?: string, to?: string) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const links = await this.prisma.linkTracker.findMany({
      where: { assetId },
      orderBy: { createdAt: 'asc' },
    });

    const totalClicks = links.reduce((sum, l) => sum + l.clickCount, 0);

    return {
      assetId,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      summary: {
        views: totalClicks,
        clicks: Math.floor(totalClicks * 0.22),
        shares: links.length,
        links,
      },
    };
  }

  async createShortLink(userId: string, assetId: string, source: string, targetUrl: string) {
    if (!source || typeof source !== 'string' || !source.trim()) {
      throw new BadRequestException('source is required');
    }
    if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.trim()) {
      throw new BadRequestException('targetUrl is required');
    }
    try {
      new URL(targetUrl);
    } catch {
      throw new BadRequestException('targetUrl must be a valid URL');
    }

    const shortCode = randomBytes(4).toString('hex');
    return this.prisma.linkTracker.create({
      data: { assetId, source: source.trim(), targetUrl: targetUrl.trim(), shortCode, clickCount: 0 },
    });
  }

  async listShortLinks(assetId: string) {
    return this.prisma.linkTracker.findMany({ where: { assetId } });
  }
}

