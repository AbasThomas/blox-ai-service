import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('realtime')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getData() {
    return this.appService.getData();
  }
}

