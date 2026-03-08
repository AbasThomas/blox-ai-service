import { Injectable } from '@nestjs/common';
import { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { mapAssetToPublicProfile } from './public-profile.mapper';

@Injectable()
export class PublicProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getResumeBySubdomain(subdomain: string): Promise<Record<string, unknown> | null> {
    const slug = (subdomain ?? '').toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!slug) return null;

    // Only expose a resume if the portfolio itself is public
    const target = await this.prisma.publishTarget.findFirst({
      where: { subdomain: slug, isActive: true, asset: { visibility: 'PUBLIC' } },
      select: { asset: { select: { content: true, user: { select: { fullName: true } } } } },
    });
    if (!target) return null;

    const content = (target.asset.content ?? {}) as Record<string, unknown>;
    const resumeAssetId = typeof content.resumeAssetId === 'string' ? content.resumeAssetId : null;
    if (!resumeAssetId) return null;

    // Fetch the linked resume asset (no visibility restriction — owner linked it intentionally)
    const resume = await this.prisma.asset.findFirst({
      where: { id: resumeAssetId, userId: target.asset.user ? undefined : undefined },
      select: { title: true, content: true },
    });
    if (!resume) return null;

    return {
      title: resume.title,
      ownerName: target.asset.user.fullName,
      content: resume.content,
    };
  }

  async getBySubdomain(subdomain: string): Promise<PublicProfilePayload | null> {
    const slug = (subdomain ?? '').toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!slug) return null;

    const target = await this.prisma.publishTarget.findFirst({
      where: {
        subdomain: slug,
        isActive: true,
        asset: { visibility: 'PUBLIC' },
      },
      include: {
        asset: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!target) return null;

    return mapAssetToPublicProfile({
      subdomain: slug,
      asset: target.asset,
    });
  }
}
