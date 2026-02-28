import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';

@Injectable()
export class CollaborationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async getComments(assetId: string) {
    return this.prisma.comment.findMany({
      where: { assetId },
      include: { user: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addComment(userId: string, assetId: string, body: string) {
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) throw new NotFoundException('Asset not found');

    const comment = await this.prisma.comment.create({
      data: { assetId, userId, body },
      include: { user: { select: { id: true, fullName: true } } },
    });

    // Notify asset owner if commenter is not the owner
    if (asset.userId !== userId) {
      await this.prisma.notification.create({
        data: {
          userId: asset.userId,
          type: 'new_comment',
          title: 'New comment on your asset',
          payload: { assetId, commentId: comment.id, preview: body.substring(0, 100) },
        },
      });
    }

    return comment;
  }

  async resolveComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { asset: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.asset.userId !== userId) throw new ForbiddenException('Not authorized');

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { resolved: true },
    });
  }

  async shareAsset(userId: string, assetId: string, visibility: string) {
    const asset = await this.prisma.asset.findFirst({ where: { id: assetId, userId } });
    if (!asset) throw new NotFoundException('Asset not found');

    const updated = await this.prisma.asset.update({
      where: { id: assetId },
      data: { visibility: visibility as 'PUBLIC' | 'PRIVATE' | 'PASSWORD' | 'TIME_LIMITED' },
    });

    const shareLink = `${process.env.APP_BASE_URL ?? 'http://localhost:4200'}/preview/${assetId}`;
    return { shareLink, visibility: updated.visibility };
  }
}


