import { Body, Controller, Get, Post } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  list() {
    return this.integrationsService.list();
  }

  @Post('connect')
  connect(@Body() payload: { provider: string }) {
    return this.integrationsService.connect(payload.provider);
  }

  @Post('disconnect')
  disconnect(@Body() payload: { provider: string }) {
    return this.integrationsService.disconnect(payload.provider);
  }
}


