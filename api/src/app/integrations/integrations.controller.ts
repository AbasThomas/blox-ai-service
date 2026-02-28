import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.integrationsService.listWithStatus(user.id);
  }

  @Get('providers')
  providers() {
    return this.integrationsService.getProviderCatalog();
  }

  @Post('connect/:provider')
  connect(@CurrentUser() user: User, @Param('provider') provider: string) {
    return this.integrationsService.connect(user.id, provider);
  }

  @Delete(':provider')
  disconnect(@CurrentUser() user: User, @Param('provider') provider: string) {
    return this.integrationsService.disconnect(user.id, provider);
  }
}
