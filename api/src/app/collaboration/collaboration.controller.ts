import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { CollaborationService } from './collaboration.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('collaboration')
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  @Get(':assetId/comments')
  getComments(
    @CurrentUser() _user: User,
    @Param('assetId') assetId: string,
  ) {
    return this.collaborationService.getComments(assetId);
  }

  @Post(':assetId/comments')
  addComment(
    @CurrentUser() user: User,
    @Param('assetId') assetId: string,
    @Body() payload: { body: string },
  ) {
    return this.collaborationService.addComment(user.id, assetId, payload.body);
  }

  @Post('comments/:commentId/resolve')
  resolveComment(
    @CurrentUser() user: User,
    @Param('commentId') commentId: string,
  ) {
    return this.collaborationService.resolveComment(user.id, commentId);
  }
}


