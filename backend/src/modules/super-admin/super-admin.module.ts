import { Module } from '@nestjs/common';
import { SuperAdminDashboardController } from './super-admin.controller';
import { SuperAdminDashboardService } from './super-admin.service';

@Module({
  controllers: [SuperAdminDashboardController],
  providers: [SuperAdminDashboardService],
  exports: [SuperAdminDashboardService],
})
export class SuperAdminDashboardModule {}
