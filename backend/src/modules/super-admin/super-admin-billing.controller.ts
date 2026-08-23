import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { SuperAdminBillingService } from './super-admin-billing.service';
import { SuperAdminBillingFilterDto } from './dto/super-admin-billing.dto';
import { PermissionGuard } from '../../core/auth/guards/permission.guard';
import { RequirePermission } from '../../core/auth/decorators/require-permission.decorator';
import { Response } from 'express';

@Controller('super-admin/billing')
@UseGuards(PermissionGuard)
export class SuperAdminBillingController {
  constructor(private billingService: SuperAdminBillingService) {}

  @Get('overview')
  @RequirePermission('admin:payments:read')
  async getOverview(@Query() query: SuperAdminBillingFilterDto) {
    return this.billingService.getFinancialOverview(query);
  }

  @Get('tenants')
  @RequirePermission('admin:payments:read')
  async getTenantFinancials(@Query() query: SuperAdminBillingFilterDto) {
    return this.billingService.getTenantFinancials(query);
  }

  @Get('reconciliation')
  @RequirePermission('admin:payments:read')
  async getReconciliation() {
    return this.billingService.getReconciliationAnomalies();
  }

  @Get('export')
  @RequirePermission('admin:finance:export')
  async exportCsv(
    @Query('type') type: 'invoices' | 'payments' | 'tenants',
    @Query() query: SuperAdminBillingFilterDto,
    @Res() res: Response,
  ) {
    const csvData = await this.billingService.exportFinancialCsv(type || 'invoices', query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=saas-financial-${type || 'invoices'}.csv`);
    return res.send(csvData);
  }
}
