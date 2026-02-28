import { Body, Controller, Get, Post } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  users() {
    return this.adminService.users();
  }

  @Get('audit-logs')
  auditLogs() {
    return this.adminService.auditLogs();
  }

  @Post('api-keys')
  createApiKey(@Body() payload: { label: string }) {
    return this.adminService.createApiKey(payload.label);
  }
}


