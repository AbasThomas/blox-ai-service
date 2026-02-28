import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { StartOnboardingImportPayload } from '@nextjs-blox/shared-types';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('import/start')
  startImport(@CurrentUser() user: User, @Body() payload: StartOnboardingImportPayload) {
    return this.onboardingService.startImport(user.id, payload);
  }

  @Get('import/:runId/status')
  getStatus(@CurrentUser() user: User, @Param('runId') runId: string) {
    return this.onboardingService.getImportStatus(user.id, runId);
  }

  @Get('import/:runId/preview')
  getPreview(@CurrentUser() user: User, @Param('runId') runId: string) {
    return this.onboardingService.getImportPreview(user.id, runId);
  }

  @Post('import/:runId/confirm')
  confirm(
    @CurrentUser() user: User,
    @Param('runId') runId: string,
    @Body() payload: { overrides?: Record<string, unknown>; acceptAutoMerge?: boolean },
  ) {
    return this.onboardingService.confirmImport(user.id, runId, payload);
  }
}
