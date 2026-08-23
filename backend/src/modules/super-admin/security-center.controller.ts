import { Controller, Get, UseGuards } from '@nestjs/common';
import { SecurityCenterService } from './security-center.service';
import { PermissionGuard } from '../../core/auth/guards/permission.guard';
import { RequirePermission } from '../../core/auth/decorators/require-permission.decorator';

@Controller('super-admin/security')
@UseGuards(PermissionGuard)
export class SecurityCenterController {
  constructor(private securityService: SecurityCenterService) {}

  @Get('overview')
  @RequirePermission('admin:logs:read')
  async getOverview() {
    return this.securityService.getSecurityOverview();
  }

  @Get('dependencies')
  @RequirePermission('admin:logs:read')
  async getDependencies() {
    return this.securityService.getDependenciesAnalysis();
  }

  @Get('events')
  @RequirePermission('admin:logs:read')
  async getEvents() {
    return this.securityService.getSecurityEvents();
  }
}
