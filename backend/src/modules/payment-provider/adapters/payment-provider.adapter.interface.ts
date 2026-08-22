export interface PaymentInitializationParams {
  amount: number;
  currency: string;
  transactionRef: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  callbackUrl?: string;
}

export interface PaymentResult {
  success: boolean;
  externalTransactionId: string;
  paymentUrl?: string;
  qrCodeUrl?: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  rawResponse?: any;
}

export interface WebhookValidationResult {
  isValid: boolean;
  externalTransactionId?: string;
  internalRef?: string;
  status?: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  amount?: number;
  currency?: string;
  rawPayload?: any;
}

export interface IPaymentProviderAdapter {
  readonly provider: string;
  readonly supportsRefund: boolean;
  readonly supportsWebhook: boolean;

  initializePayment(params: PaymentInitializationParams, config: any): Promise<PaymentResult>;
  verifyPayment(externalTransactionId: string, config: any): Promise<PaymentResult>;
  validateWebhook(headers: Record<string, any>, body: any, config: any): Promise<WebhookValidationResult>;
  refundPayment?(externalTransactionId: string, amount: number, config: any): Promise<{ success: boolean; refundRef?: string }>;
}

