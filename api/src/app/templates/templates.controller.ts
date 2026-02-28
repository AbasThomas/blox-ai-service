import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  list(
    @Query('category') category?: string,
    @Query('industry') industry?: string,
    @Query('search') search?: string,
  ) {
    return this.templatesService.list(category, industry, search);
  }

  @Get('marketplace')
  listMarketplace(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.templatesService.listMarketplace(category, search);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.templatesService.getById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/fork')
  fork(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.templatesService.fork(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('marketplace/upload')
  upload(
    @CurrentUser() user: User,
    @Body() payload: { templateId: string; priceMinor: number; currency?: string },
  ) {
    return this.templatesService.listToMarketplace(
      user.id,
      payload.templateId,
      payload.priceMinor,
      payload.currency,
    );
  }
}


