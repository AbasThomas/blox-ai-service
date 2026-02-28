import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CollaborationService } from './collaboration.service';

@Controller('collaboration')
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  @Get('workspace/:id')
  workspace(@Param('id') id: string) {
    return this.collaborationService.workspace(id);
  }

  @Post('workspace/:id/comment')
  comment(@Param('id') id: string, @Body() payload: { body: string; mention?: string }) {
    return this.collaborationService.comment(id, payload.body, payload.mention);
  }

  @Post('workspace/:id/permission')
  permission(@Param('id') id: string, @Body() payload: { userId: string; role: 'view' | 'edit' }) {
    return this.collaborationService.permission(id, payload.userId, payload.role);
  }
}


