export interface SmsSendParams {
  toPhone: string;
  message: string;
  senderId?: string;
}

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  provider: string;
  rawResponse?: any;
}

export interface ISmsProviderAdapter {
  readonly provider: string;
  sendSms(params: SmsSendParams, config: any): Promise<SmsSendResult>;
  testConnection(config: any): Promise<{ success: boolean; message: string }>;
}
