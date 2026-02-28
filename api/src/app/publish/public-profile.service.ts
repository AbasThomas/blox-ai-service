import { Injectable } from '@nestjs/common';
import { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { mapAssetToPublicProfile } from './public-profile.mapper';

@Injectable()
export class PublicProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getBySubdomain(subdomain: string): Promise<PublicProfilePayload | null> {
    const slug = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '-');
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
