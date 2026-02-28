import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get(':assetId')
  byAsset(
    @CurrentUser() user: User,
    @Param('assetId') assetId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.byAsset(user.id, assetId, from, to);
  }

  @Post(':assetId/links')
  createShortLink(
    @CurrentUser() user: User,
    @Param('assetId') assetId: string,
    @Body('source') source: string,
    @Body('targetUrl') targetUrl: string,
  ) {
    return this.analyticsService.createShortLink(user.id, assetId, source, targetUrl);
  }

  @Get(':assetId/links')
  listLinks(@Param('assetId') assetId: string) {
    return this.analyticsService.listShortLinks(assetId);
  }
}


