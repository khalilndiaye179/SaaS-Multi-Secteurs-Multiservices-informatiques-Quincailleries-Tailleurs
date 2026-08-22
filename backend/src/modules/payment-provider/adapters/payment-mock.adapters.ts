import { IPaymentProviderAdapter, PaymentInitializationParams, PaymentResult, WebhookValidationResult } from './payment-provider.adapter.interface';
import * as crypto from 'crypto';

export class BasePaymentMockAdapter implements IPaymentProviderAdapter {
  constructor(public readonly provider: string) {}

  readonly supportsRefund = true;
  readonly supportsWebhook = true;

  async initializePayment(params: PaymentInitializationParams, config: any): Promise<PaymentResult> {
    const mockExtId = `${this.provider}-EXT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return {
      success: true,
      externalTransactionId: mockExtId,
      paymentUrl: `https://pay.mock.gateway/${this.provider.toLowerCase()}/${mockExtId}`,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?data=${mockExtId}`,
      status: 'PENDING',
      rawResponse: { provider: this.provider, status: 'INITIATED', env: config.environment || 'TEST' },
    };
  }

  async verifyPayment(externalTransactionId: string, config: any): Promise<PaymentResult> {
    return {
      success: true,
      externalTransactionId,
      status: 'SUCCEEDED',
      rawResponse: { provider: this.provider, verified: true, timestamp: new Date().toISOString() },
    };
  }

  async validateWebhook(headers: Record<string, any>, body: any, config: any): Promise<WebhookValidationResult> {
    // R3 — Fail-Closed : Si aucun secret de webhook n'est configuré ou si la signature est absente
    if (!config.encryptedWebhookSecret) {
      return { isValid: false };
    }

    const signature = headers['x-signature'] || headers['stripe-signature'] || headers['x-webhook-signature'];
    if (!signature) {
      return { isValid: false };
    }

    // R2 — Calcul HMAC strict sans bypass 'valid_mock_signature'
    const secret = config.decryptedWebhookSecret || config.decryptedSecret || config.encryptedWebhookSecret;
    const expectedHmac = crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');

    if (signature !== expectedHmac) {
      return { isValid: false };
    }

    return {
      isValid: true,
      externalTransactionId: body?.externalTransactionId || body?.id || `EXT-WH-${Date.now()}`,
      internalRef: body?.transactionRef || body?.reference,
      status: body?.status === 'SUCCESS' || body?.type === 'payment_intent.succeeded' ? 'SUCCEEDED' : 'PENDING',
      amount: body?.amount ? Number(body.amount) : undefined,
      currency: body?.currency || 'XOF',
      rawPayload: body,
    };
  }

  async refundPayment(externalTransactionId: string, amount: number, config: any): Promise<{ success: boolean; refundRef?: string }> {
    return {
      success: true,
      refundRef: `REFUND-${this.provider}-${Date.now()}`,
    };
  }
}

export class WaveMockAdapter extends BasePaymentMockAdapter {
  constructor() {
    super('WAVE');
  }
}

export class OrangeMoneyMockAdapter extends BasePaymentMockAdapter {
  constructor() {
    super('ORANGE_MONEY');
  }
}

export class BizaoMockAdapter extends BasePaymentMockAdapter {
  constructor() {
    super('BIZAO');
  }
}

export class StripeMockAdapter extends BasePaymentMockAdapter {
  constructor() {
    super('STRIPE');
  }
}

export class PayTechMockAdapter extends BasePaymentMockAdapter {
  constructor() {
    super('PAYTECH');
  }
}

export class PayDunyaMockAdapter extends BasePaymentMockAdapter {
  constructor() {
    super('PAYDUNYA');
  }
}

export class CinetPayMockAdapter extends BasePaymentMockAdapter {
  constructor() {
    super('CINETPAY');
  }
}
