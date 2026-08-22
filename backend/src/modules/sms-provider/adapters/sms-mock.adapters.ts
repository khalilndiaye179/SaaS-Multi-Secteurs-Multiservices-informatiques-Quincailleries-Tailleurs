import { ISmsProviderAdapter, SmsSendParams, SmsSendResult } from './sms-provider.adapter.interface';

export class BaseSmsMockAdapter implements ISmsProviderAdapter {
  constructor(public readonly provider: string) {}

  async sendSms(params: SmsSendParams, config: any): Promise<SmsSendResult> {
    const maskedPhone = params.toPhone.replace(/(\+\d{3})\d+(\d{2})/, '$1****$2');
    const mockMsgId = `SMS-${this.provider}-${Date.now()}`;
    
    return {
      success: true,
      messageId: mockMsgId,
      status: 'SENT',
      provider: this.provider,
      rawResponse: { provider: this.provider, maskedPhone, env: config.environment || 'TEST' },
    };
  }

  async testConnection(config: any): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `[MOCK / ARCHITECTURE_READY] Test de connexion SMS réussi avec le gateway ${this.provider}.`,
    };
  }
}

export class OrangeSmsMockAdapter extends BaseSmsMockAdapter {
  constructor() {
    super('ORANGE_SMS');
  }
}

export class TwilioSmsMockAdapter extends BaseSmsMockAdapter {
  constructor() {
    super('TWILIO');
  }
}

export class InfobipSmsMockAdapter extends BaseSmsMockAdapter {
  constructor() {
    super('INFOBIP');
  }
}

export class InTouchSmsMockAdapter extends BaseSmsMockAdapter {
  constructor() {
    super('INTOUCH');
  }
}
