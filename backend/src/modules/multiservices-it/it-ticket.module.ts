import { Module } from '@nestjs/common';
import { ITMultiservicesTicketController } from './it-ticket.controller';
import { ITMultiservicesTicketService } from './it-ticket.service';
import { SmsProviderModule } from '../sms-provider/sms-provider.module';

@Module({
  imports: [SmsProviderModule],
  controllers: [ITMultiservicesTicketController],
  providers: [ITMultiservicesTicketService],
  exports: [ITMultiservicesTicketService],
})
export class ITMultiservicesTicketModule {}
