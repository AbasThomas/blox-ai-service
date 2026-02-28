import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { ScannerService } from './scanner.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('scanner')
export class ScannerController {
  constructor(private readonly scannerService: ScannerService) {}

  @Post('scan')
  scan(@CurrentUser() user: User, @Body() payload: { assetId: string; jobInput: string }) {
    return this.scannerService.scan(user.id, payload.assetId, payload.jobInput);
  }

  @Post('duplicate')
  duplicate(@CurrentUser() user: User, @Body() payload: { assetId: string; jobInput: string }) {
    return this.scannerService.duplicate(user.id, payload.assetId, payload.jobInput);
  }

  @Post('ats')
  ats(@CurrentUser() user: User, @Body() payload: { assetId: string }) {
    return this.scannerService.atsScore(user.id, payload.assetId);
  }

  @Post('critique')
  critique(@CurrentUser() user: User, @Body() payload: { assetId: string }) {
    return this.scannerService.critique(user.id, payload.assetId);
  }
}


