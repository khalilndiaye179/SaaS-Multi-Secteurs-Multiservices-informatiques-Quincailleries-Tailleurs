import { Module } from '@nestjs/common';
import { SuperAdminDashboardController } from './super-admin.controller';
import { SuperAdminDashboardService } from './super-admin.service';

import { BusinessBillingModule } from '../billing/business-billing.module';

@Module({
  imports: [BusinessBillingModule],
  controllers: [SuperAdminDashboardController],
  providers: [SuperAdminDashboardService],
  exports: [SuperAdminDashboardService],
})
export class SuperAdminDashboardModule {}

