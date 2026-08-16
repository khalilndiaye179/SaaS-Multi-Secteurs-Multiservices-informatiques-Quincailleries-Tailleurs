import { Controller, Get, UseGuards } from '@nestjs/common';
import { SecurityCenterService } from './security-center.service';
import { SuperAdminGuard } from '../../core/guards/super-admin.guard';

@Controller('super-admin/security')
@UseGuards(SuperAdminGuard)
export class SecurityCenterController {
  constructor(private securityService: SecurityCenterService) {}

  @Get('overview')
  async getOverview() {
    return this.securityService.getSecurityOverview();
  }

  @Get('dependencies')
  async getDependencies() {
    return this.securityService.getDependenciesAnalysis();
  }

  @Get('events')
  async getEvents() {
    return this.securityService.getSecurityEvents();
  }
}
