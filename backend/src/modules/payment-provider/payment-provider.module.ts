import { Module } from '@nestjs/common';
import { PaymentProviderRegistry } from './payment-provider.registry';
import { PaymentProviderService } from './payment-provider.service';
import { PaymentProviderController, TenantPaymentProviderController } from './payment-provider.controller';

@Module({
  providers: [PaymentProviderRegistry, PaymentProviderService],
  controllers: [PaymentProviderController, TenantPaymentProviderController],
  exports: [PaymentProviderRegistry, PaymentProviderService],
})
export class PaymentProviderModule {}
