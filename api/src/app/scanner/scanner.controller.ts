import { Body, Controller, Post } from '@nestjs/common';
import { ScannerService } from './scanner.service';

@Controller('scanner')
export class ScannerController {
  constructor(private readonly scannerService: ScannerService) {}

  @Post('scan')
  scan(@Body() payload: { assetId: string; jobInput: string }) {
    return this.scannerService.scan(payload.assetId, payload.jobInput);
  }

  @Post('duplicate')
  duplicate(@Body() payload: { assetId: string; jobInput: string }) {
    return this.scannerService.duplicate(payload.assetId, payload.jobInput);
  }

  @Post('critique')
  critique(@Body() payload: { assetId: string }) {
    return this.scannerService.critique(payload.assetId);
  }
}


