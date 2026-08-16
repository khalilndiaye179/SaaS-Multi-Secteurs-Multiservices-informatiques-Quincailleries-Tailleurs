import { Controller, Get, Put, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';

import { SuperAdminDashboardService } from './super-admin.service';
import { SuperAdminGuard } from '../../core/guards/super-admin.guard';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdatePricingConfigDto } from './dto/super-admin-billing.dto';

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

  @Put('tenants/:id')
  async updateTenant(
    @Param('id') tenantId: string,
    @Body() body: UpdateTenantDto,
  ) {
    return this.superAdminService.updateTenant(tenantId, body);
  }

  @Put('tenants/:id/soft-delete')
  async softDeleteTenant(@Param('id') tenantId: string) {
    return this.superAdminService.softDeleteTenant(tenantId);
  }

  @Delete('tenants/:id/hard-delete')
  async hardDeleteTenant(
    @Param('id') tenantId: string,
    @Body('confirmationCode') confirmationCode: string
  ) {
    return this.superAdminService.hardDeleteTenant(tenantId, confirmationCode);
  }

  @Get('tenants/demo-preview')
  async getDemoTenantsToPurge() {
    return this.superAdminService.getDemoTenantsToPurge();
  }

  @Post('tenants/purge-test')
  async purgeDemoTenants() {
    return this.superAdminService.purgeDemoTenants();
  }

  @Post('pricing-config')
  async updatePricingConfig(@Body() body: UpdatePricingConfigDto) {
    return this.superAdminService.updatePricingConfig(body);
  }
}




