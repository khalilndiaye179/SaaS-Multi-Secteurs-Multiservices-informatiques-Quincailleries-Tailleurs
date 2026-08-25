import { ApiClient } from '../services/api-client';

export interface BillingOverviewData {
  currency: string;
  metrics: {
    billedTotal: number;
    collectedTotal: number;
    receivablesTotal: number;
    pendingCollectedTotal: number;
    mrr: number;
    arr: number;
    activeSubscriptionsCount: number;
    totalTenantsCount: number;
  };
}

export interface AnalyticsOverviewData {
  growth: { value: number; variation?: number; status: string };
  churn: { value: number | null; status: string; explanation?: string };
  arpu: { value: number; currency: string; status: string };
  ltv: { value: number | null; currency?: string; status: string; explanation?: string };
}

export interface ProviderConfigData {
  id: string;
  provider: string;
  displayName: string;
  enabled: boolean;
  environment: string;
  currency?: string;
  publicKey?: string;
  senderId?: string;
  apiUrl?: string;
  hasSecret: boolean;
  hasWebhookSecret?: boolean;
  maskedSecret?: string;
  qrCodeUrl?: string;
}

export interface SaaSQuoteData {
  id: string;
  quoteNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  planName: string;
  durationMonths: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  validUntil: string;
  createdAt: string;
}

export interface SecurityCheckItem {
  id: string;
  name: string;
  category: string;
  status: 'PASS' | 'WARNING' | 'CRITICAL' | 'UNKNOWN' | 'NOT_CONFIGURED' | 'NOT_CHECKED';
  severity: string;
  description: string;
  evidence: string;
  checkedAt: string;
}

export interface SecurityOverviewData {
  status: string;
  totalChecks: number;
  checkedAt: string;
  checks: SecurityCheckItem[];
}

export interface TeamCollaboratorData {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  roles: string[];
  createdAt: string;
  totpEnabled?: boolean;
}

export interface TeamInvitationData {
  id: string;
  email: string;
  roleName: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuditLogItemData {
  id: string;
  actorUserId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  tenantId?: string;
  result: string;
  createdAt: string;
}

export interface AboutInfoData {
  appName: string;
  version: string;
  description: string;
  author: string;
  environment: string;
  nodeVersion: string;
  supportedSectors: string[];
  architecture: string;
}

export class SuperAdminApiService {
  // Billing API
  static async getBillingOverview(): Promise<BillingOverviewData> {
    return ApiClient.get<BillingOverviewData>('/api/super-admin/billing/overview');
  }

  static async exportBillingCsv(type: 'invoices' | 'payments' | 'tenants'): Promise<string> {
    const token = localStorage.getItem('kpsy_token');
    const res = await fetch(`/api/super-admin/billing/export?type=${type}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.text();
  }

  // Analytics BI API
  static async getAnalyticsOverview(): Promise<AnalyticsOverviewData> {
    return ApiClient.get<AnalyticsOverviewData>('/api/super-admin/analytics/overview');
  }

  static async getSectorAnalytics(): Promise<any> {
    return ApiClient.get<any>('/api/super-admin/analytics/sectors');
  }

  static async getAudienceAnalytics(): Promise<any> {
    return ApiClient.get<any>('/api/super-admin/analytics/audience');
  }

  static async getAcquisitionTimeSeries(): Promise<any> {
    return ApiClient.get<any>('/api/super-admin/analytics/timeseries/acquisition');
  }

  static async getRevenueTimeSeries(): Promise<any> {
    return ApiClient.get<any>('/api/super-admin/analytics/timeseries/revenue');
  }

  // Payment Providers API
  static async getPaymentProviders(): Promise<ProviderConfigData[]> {
    return ApiClient.get<ProviderConfigData[]>('/api/super-admin/payment-providers');
  }

  static async togglePaymentProvider(provider: string, enabled: boolean): Promise<any> {
    return ApiClient.put<any>(`/api/super-admin/payment-providers/${provider}/toggle`, { enabled });
  }

  static async upsertPaymentProviderConfig(dto: {
    provider: string;
    displayName: string;
    environment?: 'TEST' | 'PRODUCTION';
    publicKey?: string;
    secretKey?: string;
    webhookSecret?: string;
  }): Promise<any> {
    return ApiClient.post<any>('/api/super-admin/payment-providers', dto);
  }

  static async testPaymentProvider(provider: string): Promise<any> {
    return ApiClient.post<any>(`/api/super-admin/payment-providers/${provider}/test`, {});
  }

  static async uploadPaymentProviderQrCode(provider: string, file: File): Promise<any> {
    const token = localStorage.getItem('kpsy_token');
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`/api/super-admin/payment-providers/${provider}/qr-code`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Erreur lors du téléchargement du QR Code');
    }
    return res.json();
  }

  static async revokePaymentProviderQrCode(provider: string): Promise<any> {
    return ApiClient.delete<any>(`/api/super-admin/payment-providers/${provider}/qr-code`);
  }

  // SMS Providers API
  static async getSmsProviders(): Promise<ProviderConfigData[]> {
    return ApiClient.get<ProviderConfigData[]>('/api/super-admin/sms-providers');
  }

  static async toggleSmsProvider(provider: string, enabled: boolean): Promise<any> {
    return ApiClient.put<any>(`/api/super-admin/sms-providers/${provider}/toggle`, { enabled });
  }

  static async upsertSmsProviderConfig(dto: {
    provider: string;
    displayName: string;
    environment?: 'TEST' | 'PRODUCTION';
    senderId?: string;
    secretKey?: string;
  }): Promise<any> {
    return ApiClient.post<any>('/api/super-admin/sms-providers', dto);
  }

  static async testSmsProvider(provider: string): Promise<any> {
    return ApiClient.post<any>(`/api/super-admin/sms-providers/${provider}/test`, {});
  }

  // SaaS Quotes API
  static async getSaaSQuotes(): Promise<{ data: SaaSQuoteData[]; total: number }> {
    return ApiClient.get<{ data: SaaSQuoteData[]; total: number }>('/api/super-admin/saas-quotes');
  }

  static async createSaaSQuote(dto: any): Promise<SaaSQuoteData> {
    return ApiClient.post<SaaSQuoteData>('/api/super-admin/saas-quotes', dto);
  }

  static async convertSaaSQuote(id: string): Promise<any> {
    return ApiClient.post<any>(`/api/super-admin/saas-quotes/${id}/convert`, {});
  }

  static async updateSaaSQuote(id: string, dto: any): Promise<SaaSQuoteData> {
    return ApiClient.put<SaaSQuoteData>(`/api/super-admin/saas-quotes/${id}`, dto);
  }

  static async deleteSaaSQuote(id: string): Promise<any> {
    return ApiClient.delete<any>(`/api/super-admin/saas-quotes/${id}`);
  }

  static async downloadSaaSQuotePdf(id: string, quoteNumber: string): Promise<void> {
    const token = localStorage.getItem('kpsy_token');
    const res = await fetch(`/api/super-admin/saas-quotes/${id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Erreur lors de la génération du PDF.');
    
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `saas-quote-${quoteNumber}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ==========================================
  // ÉQUIPE SUPER ADMIN (RBAC & 2FA)
  // ==========================================

  static async getTeamOverview(): Promise<{ team: TeamCollaboratorData[]; invitations: TeamInvitationData[] }> {
    return ApiClient.get('/api/super-admin/team/overview');
  }

  static async inviteCollaborator(payload: { email: string; phone?: string; roleName: string }) {
    return ApiClient.post('/api/super-admin/team/invite', payload);
  }

  static async toggleCollaboratorStatus(userId: string, isActive: boolean) {
    return ApiClient.patch(`/api/super-admin/team/${userId}/status`, { isActive });
  }

  static async updateCollaboratorRole(userId: string, roleName: string) {
    return ApiClient.patch(`/api/super-admin/team/${userId}/role`, { roleName });
  }

  static async disableCollaborator2FA(userId: string) {
    return ApiClient.post(`/api/super-admin/team/${userId}/disable-2fa`, {});
  }

  static async getEnforce2fa(): Promise<{ enforce2FA: boolean }> {
    return ApiClient.get('/api/super-admin/settings/enforce-2fa');
  }

  static async setEnforce2fa(enforce2FA: boolean): Promise<{ success: boolean; enforce2FA: boolean }> {
    return ApiClient.put('/api/super-admin/settings/enforce-2fa', { enforce2FA });
  }

  // Audit Logs API
  static async getAuditLogs(page = 1, limit = 20): Promise<{ data: AuditLogItemData[]; total: number }> {
    return ApiClient.get<{ data: AuditLogItemData[]; total: number }>(`/api/super-admin/audit?page=${page}&limit=${limit}`);
  }

  // Security Center API
  static async getSecurityOverview(): Promise<SecurityOverviewData> {
    return ApiClient.get<SecurityOverviewData>('/api/super-admin/security/overview');
  }

  static async getSecurityDependencies(): Promise<any> {
    return ApiClient.get<any>('/api/super-admin/security/dependencies');
  }

  static async getSecurityEvents(): Promise<any> {
    return ApiClient.get<any>('/api/super-admin/security/events');
  }

  // About API
  static async getAboutInfo(): Promise<AboutInfoData> {
    return ApiClient.get<AboutInfoData>('/api/super-admin/about');
  }
}
