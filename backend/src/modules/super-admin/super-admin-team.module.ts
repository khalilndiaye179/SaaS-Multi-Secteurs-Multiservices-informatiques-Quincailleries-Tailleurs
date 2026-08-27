import { Module } from '@nestjs/common';
import { SuperAdminTeamService } from './super-admin-team.service';
import { SuperAdminTeamController } from './super-admin-team.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [SuperAdminTeamService],
  controllers: [SuperAdminTeamController],
  exports: [SuperAdminTeamService],
})
export class SuperAdminTeamModule {}
