import { Module } from '@nestjs/common';
import { PublicDocumentsController } from './public-documents.controller';
import { PublicDocumentsService } from './public-documents.service';
import { AuthModule } from '../../core/auth/auth.module';
import { BusinessBillingModule } from '../billing/business-billing.module';

@Module({
  imports: [AuthModule, BusinessBillingModule],
  controllers: [PublicDocumentsController],
  providers: [PublicDocumentsService],
  exports: [PublicDocumentsService],
})
export class PublicDocumentsModule {}
