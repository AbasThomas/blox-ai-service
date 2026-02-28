import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserStats() {
    const [total, byTier, assets] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.groupBy({ by: ['tier'], _count: true }),
      this.prisma.asset.count(),
    ]);
    return { total, byTier, totalAssets: assets };
  }

  async listUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? { OR: [{ email: { contains: search } }, { fullName: { contains: search } }] }
      : {};
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: { id: true, email: true, fullName: true, tier: true, createdAt: true, mfaEnabled: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users, total, page, limit };
  }

  async updateUserTier(userId: string, tier: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { tier: tier as 'FREE' | 'PRO' | 'PREMIUM' | 'ENTERPRISE' },
    });
  }

  async getAuditLogs(page = 1, limit = 50, action?: string) {
    const skip = (page - 1) * limit;
    const where = action ? { action } : {};
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: { user: { select: { email: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async createApiKey(userId: string, label: string) {
    const raw = randomBytes(32).toString('hex');
    const keyPrefix = `blox_${raw.substring(0, 8)}`;
    const keyHash = createHash('sha256').update(raw).digest('hex');

    await this.prisma.apiKey.create({
      data: { userId, label, keyPrefix, keyHash },
    });

    return { label, keyPrefix, fullKey: `${keyPrefix}_${raw.substring(8)}`, createdAt: new Date().toISOString() };
  }

  async revokeApiKey(keyId: string) {
    return this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });
  }
}


