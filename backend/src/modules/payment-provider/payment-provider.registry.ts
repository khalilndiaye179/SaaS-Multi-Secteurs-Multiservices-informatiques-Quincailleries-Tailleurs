import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { IPaymentProviderAdapter } from './adapters/payment-provider.adapter.interface';
import {
  WaveMockAdapter,
  OrangeMoneyMockAdapter,
} from './adapters/payment-mock.adapters';
import {
  PayDunyaRealAdapter,
  CinetPayRealAdapter,
  BizaoRealAdapter,
  StripeRealAdapter,
  PayTechRealAdapter,
} from './adapters/payment-real.adapters';

@Injectable()
export class PaymentProviderRegistry implements OnModuleInit {
  private adapters = new Map<string, IPaymentProviderAdapter>();

  onModuleInit() {
    this.register(new WaveMockAdapter());
    this.register(new OrangeMoneyMockAdapter());
    this.register(new BizaoRealAdapter());
    this.register(new StripeRealAdapter());
    this.register(new PayTechRealAdapter());
    this.register(new PayDunyaRealAdapter());
    this.register(new CinetPayRealAdapter());
  }

  register(adapter: IPaymentProviderAdapter) {
    this.adapters.set(adapter.provider.toUpperCase(), adapter);
  }

  get(provider: string): IPaymentProviderAdapter {
    const adapter = this.adapters.get(provider.toUpperCase());
    if (!adapter) {
      throw new NotFoundException(`Le fournisseur de paiement '${provider}' n'est pas enregistré sur la plateforme.`);
    }
    return adapter;
  }

  has(provider: string): boolean {
    return this.adapters.has(provider.toUpperCase());
  }

  listSupported(): string[] {
    return Array.from(this.adapters.keys());
  }
}
