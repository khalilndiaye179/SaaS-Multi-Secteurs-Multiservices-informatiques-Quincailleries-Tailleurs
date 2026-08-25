import { Module } from '@nestjs/common';
import { ITMultiservicesTicketController } from './it-ticket.controller';
import { ITMultiservicesTicketService } from './it-ticket.service';
import { ITServicePackageController } from './it-service-package.controller';
import { ITServicePackageService } from './it-service-package.service';
import { SmsProviderModule } from '../sms-provider/sms-provider.module';

@Module({
  imports: [SmsProviderModule],
  controllers: [ITMultiservicesTicketController, ITServicePackageController],
  providers: [ITMultiservicesTicketService, ITServicePackageService],
  exports: [ITMultiservicesTicketService, ITServicePackageService],
})
export class ITMultiservicesTicketModule {}
