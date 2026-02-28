import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(category?: string, industry?: string, search?: string) {
    return this.prisma.template.findMany({
      where: {
        isPublic: true,
        ...(category && { category }),
        ...(industry && { industry }),
        ...(search && { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getById(id: string) {
    const template = await this.prisma.template.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async fork(userId: string, templateId: string) {
    const template = await this.getById(templateId);

    await this.prisma.templateFork.create({
      data: { templateId, userId },
    });

    const asset = await this.prisma.asset.create({
      data: {
        userId,
        type: template.category === 'resume' ? 'RESUME' : template.category === 'cover_letter' ? 'COVER_LETTER' : 'PORTFOLIO',
        title: `${template.name} (My Copy)`,
        content: { sections: [], templateId, definition: template.definition } as Prisma.InputJsonValue,
        healthScore: 0,
        visibility: 'PRIVATE',
      },
    });

    return { assetId: asset.id, templateId, status: 'created' };
  }

  async create(userId: string, dto: {
    name: string;
    category: string;
    industry: string;
    definition: Record<string, unknown>;
    priceMinor?: number;
    currency?: string;
  }) {
    return this.prisma.template.create({
      data: {
        ownerId: userId,
        name: dto.name,
        category: dto.category,
        industry: dto.industry,
        definition: dto.definition as Prisma.InputJsonValue,
        priceMinor: dto.priceMinor ?? null,
        currency: dto.currency ?? null,
        isPublic: false,
      },
    });
  }

  async listMarketplace(category?: string, search?: string) {
    return this.prisma.marketplaceListing.findMany({
      where: {
        status: 'active',
        template: {
          ...(category && { category }),
          ...(search && { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } }),
        },
      },
      include: { template: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async listToMarketplace(userId: string, templateId: string, priceMinor: number, currency = 'NGN') {
    const template = await this.getById(templateId);

    return this.prisma.marketplaceListing.create({
      data: {
        templateId: template.id,
        sellerId: userId,
        priceMinor,
        currency,
        status: 'active',
      },
    });
  }
}


