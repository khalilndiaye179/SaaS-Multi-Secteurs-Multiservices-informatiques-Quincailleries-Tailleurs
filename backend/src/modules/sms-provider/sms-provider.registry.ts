import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ISmsProviderAdapter } from './adapters/sms-provider.adapter.interface';
import {
  OrangeSmsMockAdapter,
  TwilioSmsMockAdapter,
  InfobipSmsMockAdapter,
  InTouchSmsMockAdapter,
} from './adapters/sms-mock.adapters';

@Injectable()
export class SmsProviderRegistry implements OnModuleInit {
  private adapters = new Map<string, ISmsProviderAdapter>();

  onModuleInit() {
    this.register(new OrangeSmsMockAdapter());
    this.register(new TwilioSmsMockAdapter());
    this.register(new InfobipSmsMockAdapter());
    this.register(new InTouchSmsMockAdapter());
  }

  register(adapter: ISmsProviderAdapter) {
    this.adapters.set(adapter.provider.toUpperCase(), adapter);
  }

  get(provider: string): ISmsProviderAdapter {
    const adapter = this.adapters.get(provider.toUpperCase());
    if (!adapter) {
      throw new NotFoundException(`Le fournisseur SMS '${provider}' n'est pas enregistré sur la plateforme.`);
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
