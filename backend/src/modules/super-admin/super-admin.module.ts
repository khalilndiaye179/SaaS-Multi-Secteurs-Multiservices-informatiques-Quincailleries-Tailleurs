import { Module } from '@nestjs/common';
import { SuperAdminDashboardController } from './super-admin.controller';
import { SuperAdminDashboardService } from './super-admin.service';

import { BusinessBillingModule } from '../billing/business-billing.module';
import { SuperAdminAuditModule } from './super-admin-audit.module';

@Module({
  imports: [BusinessBillingModule, SuperAdminAuditModule],
  controllers: [SuperAdminDashboardController],
  providers: [SuperAdminDashboardService],
  exports: [SuperAdminDashboardService],
})
export class SuperAdminDashboardModule {}

