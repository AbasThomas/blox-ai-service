import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TemplatesService } from './templates.service';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  list(@Query('role') role?: string, @Query('industry') industry?: string) {
    return this.templatesService.list(role, industry);
  }

  @Post('fork')
  fork(@Body() payload: { templateId: string; userId: string }) {
    return this.templatesService.fork(payload.templateId, payload.userId);
  }

  @Post('marketplace/upload')
  upload(@Body() payload: { templateId: string; priceMinor: number; currency: string }) {
    return this.templatesService.uploadToMarketplace(payload);
  }
}


