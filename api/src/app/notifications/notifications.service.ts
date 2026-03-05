import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateNotificationDto {
  userId: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  payload?: Record<string, unknown>;
}

const BILLING_TYPES = ['subscription_cancelled', 'subscription_activated', 'payment_failed', 'payment_success'];
const MENTION_TYPES = ['new_comment', 'collaboration_invite'];
const PORTFOLIO_TYPES = ['asset_generated', 'portfolio_published', 'portfolio_viewed', 'health_score_improved', 'export_completed'];

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: string,
    {
      page = 1,
      limit = 20,
      filter = 'all',
    }: { page?: number; limit?: number; filter?: string },
  ) {
    const where: Record<string, unknown> = { userId };

    if (filter === 'unread') {
      where['readAt'] = null;
    } else if (filter === 'portfolio') {
      where['type'] = { in: PORTFOLIO_TYPES };
    } else if (filter === 'billing') {
      where['type'] = { in: BILLING_TYPES };
    } else if (filter === 'mentions') {
      where['type'] = { in: MENTION_TYPES };
    }

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      hasMore: page * limit < total,
      unreadCount,
    };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  async markRead(userId: string, ids?: string[]): Promise<{ updated: number }> {
    const where: Record<string, unknown> = { userId, readAt: null };
    if (ids && ids.length > 0) {
      where['id'] = { in: ids };
    }
    const result = await this.prisma.notification.updateMany({
      where,
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message ?? '',
        link: dto.link,
        payload: dto.payload !== undefined
          ? (dto.payload as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
  }
}
