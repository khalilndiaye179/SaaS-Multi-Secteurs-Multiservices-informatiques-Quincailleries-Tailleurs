import { Controller, Get, Put, Post, Param, Body, UseGuards } from '@nestjs/common';

import { SuperAdminDashboardService } from './super-admin.service';
import { SuperAdminGuard } from '../../core/guards/super-admin.guard';

@Controller('super-admin')
@UseGuards(SuperAdminGuard)
export class SuperAdminDashboardController {

  constructor(private superAdminService: SuperAdminDashboardService) {}

  @Get('stats')
  async getGlobalStats() {
    return this.superAdminService.getGlobalStats();
  }

  @Get('tenants')
  async getAllTenants() {
    return this.superAdminService.getAllTenants();
  }

  @Put('tenants/:id/status')
  async updateTenantBillingStatus(
    @Param('id') tenantId: string,
    @Body('status') status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED',
  ) {
    return this.superAdminService.updateTenantBillingStatus(tenantId, status);
  }

  @Put('tenants/:id/approve-payment')
  async approvePayment(
    @Param('id') tenantId: string,
    @Body('durationMonths') durationMonths: number,
    @Body('proofId') proofId?: string,
  ) {
    return this.superAdminService.approvePayment(tenantId, durationMonths || 1, proofId);
  }

  @Get('payment-proofs')
  async getAllPaymentProofs() {
    return this.superAdminService.getAllPaymentProofs();
  }

  @Put('payment-proofs/:id/reject')
  async rejectPayment(
    @Param('id') proofId: string,
    @Body('reason') reason?: string,
  ) {
    return this.superAdminService.rejectPayment(proofId, reason);
  }

  @Post('tenants/purge-test')
  async purgeDemoTenants() {
    return this.superAdminService.purgeDemoTenants();
  }
}



