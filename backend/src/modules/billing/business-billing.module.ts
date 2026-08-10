import { Module } from '@nestjs/common';
import { BusinessBillingService } from './business-billing.service';
import { BusinessBillingController } from './business-billing.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BusinessBillingController],
  providers: [BusinessBillingService],
  exports: [BusinessBillingService],
})
export class BusinessBillingModule {}
