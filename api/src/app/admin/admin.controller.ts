import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  users(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.listUsers(
      Number(page ?? 1),
      Number(limit ?? 20),
      search,
    );
  }

  @Get('audit-logs')
  auditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
  ) {
    return this.adminService.getAuditLogs(
      Number(page ?? 1),
      Number(limit ?? 50),
      action,
    );
  }

  @Post('api-keys')
  createApiKey(@Body() payload: { userId: string; label: string }) {
    return this.adminService.createApiKey(payload.userId, payload.label);
  }
}


