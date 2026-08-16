import { Module } from '@nestjs/common';
import { SuperAdminAnalyticsService } from './super-admin-analytics.service';
import { SuperAdminAnalyticsController } from './super-admin-analytics.controller';
import { SuperAdminBillingModule } from './super-admin-billing.module';

@Module({
  imports: [SuperAdminBillingModule],
  providers: [SuperAdminAnalyticsService],
  controllers: [SuperAdminAnalyticsController],
  exports: [SuperAdminAnalyticsService],
})
export class SuperAdminAnalyticsModule {}
