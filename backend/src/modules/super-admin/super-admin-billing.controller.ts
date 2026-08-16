import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { SuperAdminBillingService } from './super-admin-billing.service';
import { SuperAdminBillingFilterDto } from './dto/super-admin-billing.dto';
import { SuperAdminGuard } from '../../core/guards/super-admin.guard';
import { Response } from 'express';

@Controller('super-admin/billing')
@UseGuards(SuperAdminGuard)
export class SuperAdminBillingController {
  constructor(private billingService: SuperAdminBillingService) {}

  @Get('overview')
  async getOverview(@Query() query: SuperAdminBillingFilterDto) {
    return this.billingService.getFinancialOverview(query);
  }

  @Get('tenants')
  async getTenantFinancials(@Query() query: SuperAdminBillingFilterDto) {
    return this.billingService.getTenantFinancials(query);
  }

  @Get('reconciliation')
  async getReconciliation() {
    return this.billingService.getReconciliationAnomalies();
  }

  @Get('export')
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
