import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SuperAdminAnalyticsService } from './super-admin-analytics.service';
import { SuperAdminAnalyticsFilterDto } from './dto/super-admin-analytics.dto';
import { PermissionGuard } from '../../core/auth/guards/permission.guard';
import { RequirePermission } from '../../core/auth/decorators/require-permission.decorator';

@Controller('super-admin/analytics')
@UseGuards(PermissionGuard)
export class SuperAdminAnalyticsController {
  constructor(private analyticsService: SuperAdminAnalyticsService) {}

  @Get('overview')
  @RequirePermission('admin:metrics:read')
  async getOverview(@Query() query: SuperAdminAnalyticsFilterDto) {
    const [growth, churn, arpu, ltv] = await Promise.all([
      this.analyticsService.getTenantGrowth(query),
      this.analyticsService.getChurnRate(query),
      this.analyticsService.getArpu(query),
      this.analyticsService.getLtv(query),
    ]);

    return {
      growth,
      churn,
      arpu,
      ltv,
    };
  }

  @Get('growth')
  @RequirePermission('admin:metrics:read')
  async getGrowth(@Query() query: SuperAdminAnalyticsFilterDto) {
    return this.analyticsService.getTenantGrowth(query);
  }

  @Get('churn')
  @RequirePermission('admin:metrics:read')
  async getChurn(@Query() query: SuperAdminAnalyticsFilterDto) {
    return this.analyticsService.getChurnRate(query);
  }

  @Get('arpu')
  @RequirePermission('admin:metrics:read')
  async getArpu(@Query() query: SuperAdminAnalyticsFilterDto) {
    return this.analyticsService.getArpu(query);
  }

  @Get('ltv')
  @RequirePermission('admin:metrics:read')
  async getLtv(@Query() query: SuperAdminAnalyticsFilterDto) {
    return this.analyticsService.getLtv(query);
  }

  @Get('sectors')
  @RequirePermission('admin:metrics:read')
  async getSectors() {
    return this.analyticsService.getSectorAnalytics();
  }

  @Get('audience')
  @RequirePermission('admin:metrics:read')
  async getAudience(@Query() query: SuperAdminAnalyticsFilterDto) {
    return this.analyticsService.getAudienceAnalytics(query);
  }

  @Get('timeseries/acquisition')
  @RequirePermission('admin:metrics:read')
  async getAcquisitionTimeSeries(@Query() query: SuperAdminAnalyticsFilterDto) {
    return this.analyticsService.getAcquisitionTimeSeries(query);
  }

  @Get('timeseries/revenue')
  @RequirePermission('admin:metrics:read')
  async getRevenueTimeSeries(@Query() query: SuperAdminAnalyticsFilterDto) {
    return this.analyticsService.getRevenueTimeSeries(query);
  }
}
