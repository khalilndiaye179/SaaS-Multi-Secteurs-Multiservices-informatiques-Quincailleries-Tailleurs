import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SuperAdminAnalyticsService } from './super-admin-analytics.service';
import { SuperAdminAnalyticsFilterDto } from './dto/super-admin-analytics.dto';
import { SuperAdminGuard } from '../../core/guards/super-admin.guard';

@Controller('super-admin/analytics')
@UseGuards(SuperAdminGuard)
export class SuperAdminAnalyticsController {
  constructor(private analyticsService: SuperAdminAnalyticsService) {}

  @Get('overview')
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
  async getGrowth(@Query() query: SuperAdminAnalyticsFilterDto) {
    return this.analyticsService.getTenantGrowth(query);
  }

  @Get('churn')
  async getChurn(@Query() query: SuperAdminAnalyticsFilterDto) {
    return this.analyticsService.getChurnRate(query);
  }

  @Get('arpu')
  async getArpu(@Query() query: SuperAdminAnalyticsFilterDto) {
    return this.analyticsService.getArpu(query);
  }

  @Get('ltv')
  async getLtv(@Query() query: SuperAdminAnalyticsFilterDto) {
    return this.analyticsService.getLtv(query);
  }

  @Get('sectors')
  async getSectors() {
    return this.analyticsService.getSectorAnalytics();
  }

  @Get('audience')
  async getAudience(@Query() query: SuperAdminAnalyticsFilterDto) {
    return this.analyticsService.getAudienceAnalytics(query);
  }
}
