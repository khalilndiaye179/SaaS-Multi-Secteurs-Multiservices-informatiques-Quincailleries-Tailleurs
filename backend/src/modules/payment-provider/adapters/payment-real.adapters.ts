import { IPaymentProviderAdapter, PaymentInitializationParams, PaymentResult, WebhookValidationResult } from './payment-provider.adapter.interface';
import * as crypto from 'crypto';

/**
 * Implémentation réelle pour PayDunya
 */
export class PayDunyaRealAdapter implements IPaymentProviderAdapter {
  readonly provider = 'PAYDUNYA';
  readonly supportsRefund = true;
  readonly supportsWebhook = true;

  async initializePayment(params: PaymentInitializationParams, config: any): Promise<PaymentResult> {
    const url = 'https://app.paydunya.com/api/v1/checkout-invoice/create';
    
    // Pour PayDunya, on utilise publicKey pour le TOKEN et decryptedSecret pour le PrivateKey/MasterKey
    const payload = {
      invoice: {
        total_amount: params.amount,
        description: `Paiement ${params.transactionRef}`,
      },
      store: {
        name: 'SaaS Multi-Secteurs',
        return_url: params.callbackUrl,
        cancel_url: params.callbackUrl,
      },
      custom_data: {
        transactionRef: params.transactionRef,
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'PAYDUNYA-MASTER-KEY': config.decryptedSecret || '',
          'PAYDUNYA-PRIVATE-KEY': config.decryptedSecret || '',
          'PAYDUNYA-TOKEN': config.publicKey || '',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.response_code === '00') {
        return {
          success: true,
          externalTransactionId: data.token || params.transactionRef,
          paymentUrl: data.response_text, // URL de redirection PayDunya
          status: 'PENDING',
          rawResponse: data,
        };
      } else {
        throw new Error(data.response_text || 'Erreur lors de la création de la facture PayDunya');
      }
    } catch (err: any) {
      return {
        success: false,
        externalTransactionId: params.transactionRef,
        status: 'FAILED',
        rawResponse: { error: err.message },
      };
    }
  }

  async verifyPayment(externalTransactionId: string, config: any): Promise<PaymentResult> {
    const url = `https://app.paydunya.com/api/v1/checkout-invoice/confirm/${externalTransactionId}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'PAYDUNYA-MASTER-KEY': config.decryptedSecret || '',
          'PAYDUNYA-PRIVATE-KEY': config.decryptedSecret || '',
          'PAYDUNYA-TOKEN': config.publicKey || '',
        },
      });
      const data = await response.json();

      const status = data.status === 'completed' ? 'SUCCEEDED' : data.status === 'failed' ? 'FAILED' : 'PENDING';
      
      return {
        success: status === 'SUCCEEDED',
        externalTransactionId,
        status,
        rawResponse: data,
      };
    } catch (err: any) {
      return { success: false, externalTransactionId, status: 'FAILED', rawResponse: { error: err.message } };
    }
  }

  async validateWebhook(headers: Record<string, any>, body: any, config: any): Promise<WebhookValidationResult> {
    if (!config.decryptedWebhookSecret) return { isValid: false };
    
    const hash = headers['paydunya-webhook-hash'] || body?.hash;
    const computedHash = crypto.createHash('sha512').update(config.decryptedWebhookSecret).digest('hex');

    if (hash && hash === computedHash) {
      return {
        isValid: true,
        externalTransactionId: body?.invoice?.token,
        internalRef: body?.custom_data?.transactionRef,
        status: body?.status === 'completed' ? 'SUCCEEDED' : 'FAILED',
        amount: body?.invoice?.total_amount,
        currency: 'XOF',
        rawPayload: body,
      };
    }
    return { isValid: false };
  }
}

/**
 * Implémentation réelle pour CinetPay
 */
export class CinetPayRealAdapter implements IPaymentProviderAdapter {
  readonly provider = 'CINETPAY';
  readonly supportsRefund = false;
  readonly supportsWebhook = true;

  async initializePayment(params: PaymentInitializationParams, config: any): Promise<PaymentResult> {
    const url = 'https://api-checkout.cinetpay.com/v2/payment';
    
    // CinetPay map: publicKey = site_id, decryptedSecret = apikey
    const payload = {
      apikey: config.decryptedSecret,
      site_id: config.publicKey,
      transaction_id: params.transactionRef,
      amount: params.amount,
      currency: params.currency || 'XOF',
      description: `Paiement ${params.transactionRef}`,
      customer_email: params.customerEmail,
      customer_name: params.customerName || 'Client',
      customer_surname: 'Web',
      notify_url: config.callbackUrl || 'https://votre-domaine.com/webhook',
      return_url: params.callbackUrl,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.code === '201') {
        return {
          success: true,
          externalTransactionId: params.transactionRef,
          paymentUrl: data.data.payment_url,
          status: 'PENDING',
          rawResponse: data,
        };
      } else {
        throw new Error(data.message || data.description || 'Erreur CinetPay');
      }
    } catch (err: any) {
      return {
        success: false,
        externalTransactionId: params.transactionRef,
        status: 'FAILED',
        rawResponse: { error: err.message },
      };
    }
  }

  async verifyPayment(externalTransactionId: string, config: any): Promise<PaymentResult> {
    const url = 'https://api-checkout.cinetpay.com/v2/payment/check';
    const payload = {
      apikey: config.decryptedSecret,
      site_id: config.publicKey,
      transaction_id: externalTransactionId,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      
      const status = data.data?.status === 'ACCEPTED' ? 'SUCCEEDED' : 'FAILED';
      return {
        success: status === 'SUCCEEDED',
        externalTransactionId,
        status,
        rawResponse: data,
      };
    } catch (err: any) {
      return { success: false, externalTransactionId, status: 'FAILED', rawResponse: { error: err.message } };
    }
  }

  async validateWebhook(headers: Record<string, any>, body: any, config: any): Promise<WebhookValidationResult> {
    if (!config.decryptedWebhookSecret) return { isValid: false };
    
    const signature = headers['x-token'];
    const expected = crypto.createHmac('sha256', config.decryptedWebhookSecret).update(body?.cpm_trans_id || '').digest('hex');

    if (signature && signature === expected) {
      return {
        isValid: true,
        externalTransactionId: body?.cpm_trans_id,
        internalRef: body?.cpm_trans_id,
        status: body?.cpm_result === '00' ? 'SUCCEEDED' : 'FAILED',
        amount: body?.cpm_amount,
        currency: body?.cpm_currency,
        rawPayload: body,
      };
    }
    
    return { isValid: false };
  }
}

/**
 * Squelettes pour Stripe, Bizao, PayTech
 */
export class StripeRealAdapter implements IPaymentProviderAdapter {
  readonly provider = 'STRIPE';
  readonly supportsRefund = true;
  readonly supportsWebhook = true;

  async initializePayment(params: PaymentInitializationParams, config: any): Promise<PaymentResult> {
    return { success: false, externalTransactionId: params.transactionRef, status: 'FAILED', rawResponse: { error: 'Not fully implemented' } };
  }
  async verifyPayment(externalTransactionId: string, config: any): Promise<PaymentResult> {
    return { success: false, externalTransactionId, status: 'FAILED', rawResponse: { error: 'Not fully implemented' } };
  }
  async validateWebhook(headers: Record<string, any>, body: any, config: any): Promise<WebhookValidationResult> {
    return { isValid: false };
  }
}

export class BizaoRealAdapter implements IPaymentProviderAdapter {
  readonly provider = 'BIZAO';
  readonly supportsRefund = false;
  readonly supportsWebhook = true;

  async initializePayment(params: PaymentInitializationParams, config: any): Promise<PaymentResult> {
    return { success: false, externalTransactionId: params.transactionRef, status: 'FAILED', rawResponse: { error: 'Not fully implemented' } };
  }
  async verifyPayment(externalTransactionId: string, config: any): Promise<PaymentResult> {
    return { success: false, externalTransactionId, status: 'FAILED', rawResponse: { error: 'Not fully implemented' } };
  }
  async validateWebhook(headers: Record<string, any>, body: any, config: any): Promise<WebhookValidationResult> {
    return { isValid: false };
  }
}

export class PayTechRealAdapter implements IPaymentProviderAdapter {
  readonly provider = 'PAYTECH';
  readonly supportsRefund = false;
  readonly supportsWebhook = true;

  async initializePayment(params: PaymentInitializationParams, config: any): Promise<PaymentResult> {
    return { success: false, externalTransactionId: params.transactionRef, status: 'FAILED', rawResponse: { error: 'Not fully implemented' } };
  }
  async verifyPayment(externalTransactionId: string, config: any): Promise<PaymentResult> {
    return { success: false, externalTransactionId, status: 'FAILED', rawResponse: { error: 'Not fully implemented' } };
  }
  async validateWebhook(headers: Record<string, any>, body: any, config: any): Promise<WebhookValidationResult> {
    return { isValid: false };
  }
}
