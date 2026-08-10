import { Module } from '@nestjs/common';
import { ITMultiservicesTicketController } from './it-ticket.controller';
import { ITMultiservicesTicketService } from './it-ticket.service';

@Module({
  controllers: [ITMultiservicesTicketController],
  providers: [ITMultiservicesTicketService],
  exports: [ITMultiservicesTicketService],
})
export class ITMultiservicesTicketModule {}
