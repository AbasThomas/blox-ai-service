import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /** Public — called by PortfolioViewTracker from subdomain pages (no auth) */
  @Post('track')
  @HttpCode(200)
  track(@Body() body: Record<string, unknown>) {
    return this.analyticsService.recordPublicEvent(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':assetId')
  byAsset(
    @CurrentUser() user: User,
    @Param('assetId') assetId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.byAsset(user.id, assetId, from, to);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':assetId/links')
  createShortLink(
    @CurrentUser() user: User,
    @Param('assetId') assetId: string,
    @Body('source') source: string,
    @Body('targetUrl') targetUrl: string,
  ) {
    return this.analyticsService.createShortLink(user.id, assetId, source, targetUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':assetId/links')
  listLinks(@Param('assetId') assetId: string) {
    return this.analyticsService.listShortLinks(assetId);
  }
}


