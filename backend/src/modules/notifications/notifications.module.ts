import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './email.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailOtpService } from './email-otp.service';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService, EmailOtpService],
  exports: [NotificationsService, EmailService, EmailOtpService],
})
export class NotificationsModule {}
