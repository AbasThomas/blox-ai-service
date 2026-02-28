import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { PublishService } from './publish.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('publish')
export class PublishController {
  constructor(private readonly publishService: PublishService) {}

  @Post()
  publish(
    @CurrentUser() user: User,
    @Body()
    payload: {
      assetId: string;
      subdomain: string;
      customDomain?: string;
      scheduleAt?: string;
    },
  ) {
    return this.publishService.publish(
      user.id,
      payload.assetId,
      payload.subdomain,
      payload.customDomain,
      payload.scheduleAt,
    );
  }

  @Post(':assetId/unpublish')
  unpublish(@CurrentUser() user: User, @Param('assetId') assetId: string) {
    return this.publishService.unpublish(user.id, assetId);
  }

  @Get(':assetId/status')
  getStatus(@CurrentUser() user: User, @Param('assetId') assetId: string) {
    return this.publishService.getStatus(user.id, assetId);
  }
}


