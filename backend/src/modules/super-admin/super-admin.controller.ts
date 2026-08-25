import { Controller, Get, Put, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';

import { SuperAdminDashboardService } from './super-admin.service';
import { SuperAdminGuard } from '../../core/guards/super-admin.guard';
import { PermissionGuard } from '../../core/auth/guards/permission.guard';
import { RequirePermission } from '../../core/auth/decorators/require-permission.decorator';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdatePricingConfigDto } from './dto/super-admin-billing.dto';

@Controller('super-admin')
@UseGuards(PermissionGuard)
export class SuperAdminDashboardController {

  constructor(private superAdminService: SuperAdminDashboardService) {}

  @Get('stats')
  @RequirePermission('admin:metrics:read')
  async getGlobalStats() {
    return this.superAdminService.getGlobalStats();
  }

  @Get('tenants')
  @RequirePermission('admin:tenants:read')
  async getAllTenants() {
    return this.superAdminService.getAllTenants();
  }

  @Put('tenants/:id/status')
  @RequirePermission('admin:payments:approve')
  async updateTenantBillingStatus(
    @Param('id') tenantId: string,
    @Body('status') status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED',
  ) {
    return this.superAdminService.updateTenantBillingStatus(tenantId, status);
  }

  @Put('tenants/:id/approve-payment')
  @RequirePermission('admin:payments:approve')
  async approvePayment(
    @Param('id') tenantId: string,
    @Body('durationMonths') durationMonths: number,
    @Body('proofId') proofId?: string,
  ) {
    return this.superAdminService.approvePayment(tenantId, durationMonths || 1, proofId);
  }

  @Get('payment-proofs')
  @RequirePermission('admin:payments:read')
  async getAllPaymentProofs() {
    return this.superAdminService.getAllPaymentProofs();
  }

  @Put('payment-proofs/:id/reject')
  @RequirePermission('admin:payments:approve')
  async rejectPayment(
    @Param('id') proofId: string,
    @Body('reason') reason?: string,
    @Body('tenantId') tenantId?: string,
  ) {
    return this.superAdminService.rejectPayment(proofId, tenantId, reason);
  }

  @Put('tenants/:id')
  @UseGuards(SuperAdminGuard)
  async updateTenant(
    @Param('id') tenantId: string,
    @Body() body: UpdateTenantDto,
  ) {
    return this.superAdminService.updateTenant(tenantId, body);
  }

  @Put('tenants/:id/soft-delete')
  @UseGuards(SuperAdminGuard)
  async softDeleteTenant(@Param('id') tenantId: string) {
    return this.superAdminService.softDeleteTenant(tenantId);
  }

  @Delete('tenants/:id/hard-delete')
  @UseGuards(SuperAdminGuard)
  async hardDeleteTenant(
    @Param('id') tenantId: string,
    @Body('confirmationCode') confirmationCode: string
  ) {
    return this.superAdminService.hardDeleteTenant(tenantId, confirmationCode);
  }

  @Get('tenants/demo-preview')
  @RequirePermission('admin:tenants:read')
  async getDemoTenantsToPurge() {
    return this.superAdminService.getDemoTenantsToPurge();
  }

  @Post('tenants/purge-test')
  @UseGuards(SuperAdminGuard)
  async purgeDemoTenants() {
    return this.superAdminService.purgeDemoTenants();
  }

  @Post('pricing-config')
  @UseGuards(SuperAdminGuard)
  async updatePricingConfig(@Body() body: UpdatePricingConfigDto) {
    return this.superAdminService.updatePricingConfig(body);
  }

  @Get('settings/enforce-2fa')
  @UseGuards(SuperAdminGuard)
  async getEnforce2fa() {
    return this.superAdminService.getEnforce2fa();
  }

  @Put('settings/enforce-2fa')
  @UseGuards(SuperAdminGuard)
  async setEnforce2fa(@Body('enforce2FA') enforce: boolean) {
    return this.superAdminService.setEnforce2fa(enforce);
  }
}




