import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { AssetType, Visibility } from '@nextjs-blox/shared-types';
import { User } from '@prisma/client';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  list(@CurrentUser() user: User, @Query('type') type?: AssetType) {
    return this.assetsService.list(user.id, type);
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Body() payload: { type: AssetType; title: string; templateId?: string },
  ) {
    return this.assetsService.create(user.id, payload.type, payload.title, payload.templateId);
  }

  @Get('limits')
  limits() {
    return this.assetsService.tierLimits();
  }

  @Get(':id')
  getById(@CurrentUser() user: User, @Param('id') id: string) {
    return this.assetsService.getById(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body()
    patch: {
      title?: string;
      content?: Record<string, unknown>;
      visibility?: Visibility;
      seoConfig?: Record<string, unknown>;
    },
  ) {
    return this.assetsService.update(user.id, id, patch);
  }

  @Delete(':id')
  deleteById(@CurrentUser() user: User, @Param('id') id: string) {
    return this.assetsService.deleteById(user.id, id);
  }

  @Post(':id/generate')
  generate(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('prompt') prompt: string,
  ) {
    return this.assetsService.generate(user.id, id, prompt);
  }

  @Post(':id/seo/suggest')
  suggestSeo(@CurrentUser() user: User, @Param('id') id: string) {
    return this.assetsService.suggestSeo(user.id, id);
  }

  @Post(':id/seo/og-image')
  generateOgImage(@CurrentUser() user: User, @Param('id') id: string) {
    return this.assetsService.generateOgImage(user.id, id);
  }

  @Post(':id/duplicate')
  duplicate(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('jobDescription') jobDescription?: string,
  ) {
    return this.assetsService.duplicateForJob(user.id, id, jobDescription);
  }

  @Get(':id/versions')
  listVersions(@CurrentUser() user: User, @Param('id') id: string) {
    return this.assetsService.listVersions(user.id, id);
  }

  @Post(':id/versions')
  saveVersion(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('label') label: string,
    @Body('branch') branch?: string,
  ) {
    return this.assetsService.saveVersion(user.id, id, label, branch);
  }

  @Post(':id/versions/:versionId/restore')
  restoreVersion(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.assetsService.restoreVersion(user.id, id, versionId);
  }
}

