import React, { useState } from 'react';
import { Sidebar } from './layout/Sidebar';
import { TopHeader } from './layout/TopHeader';
import { SuperAdminMetricsDashboard } from './super-admin/SuperAdminMetricsDashboard';
import { PaymentProofsQueue } from './super-admin/PaymentProofsQueue';
import { SuperAdminTenantsList } from './super-admin/SuperAdminTenantsList';
import { SuperAdminBillingView } from './super-admin/SuperAdminBillingView';
import { PricingPlansView } from './super-admin/PricingPlansView';
import { SaaSQuotesView } from './super-admin/SaaSQuotesView';
import { ProviderManagerView } from './super-admin/ProviderManagerView';
import { AnalyticsView } from './super-admin/AnalyticsView';
import { TeamManagerView } from './super-admin/TeamManagerView';
import { AuditLogsView } from './super-admin/AuditLogsView';
import { SecurityCenterView } from './super-admin/SecurityCenterView';
import { AboutView } from './super-admin/AboutView';
import { AiAssistantWidget } from './shared/AiAssistantWidget';
import { AiInventoryAuditManager } from './shared/AiInventoryAuditManager';

interface Props {
  onLogout: () => void;
}

export const SuperAdminDashboard: React.FC<Props> = ({ onLogout }) => {
  const user = JSON.parse(localStorage.getItem('kpsy_user') || '{}');
  const [activeTab, setActiveTab] = useState('overview');
  const themeColor = '#312E81';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Sidebar Latérale Super Admin */}
      <Sidebar
        sector="SUPER_ADMIN"
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        themeColor={themeColor}
        tenantName="Super Admin HQ"
      />

      {/* Zone Principale */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        <TopHeader
          tenantName="Administration SaaS UEMOA"
          tenantCode="HQ-ADMIN"
          sector="SUPER_ADMIN"
          userName={user?.fullName || user?.username}
          themeColor={themeColor}
          onLogout={onLogout}
          isSuperAdmin={true}
        />

        <main style={{ padding: '32px 36px', maxWidth: 1280, width: '100%', margin: '0 auto' }}>
          {activeTab === 'overview' && <SuperAdminMetricsDashboard themeColor={themeColor} />}
          {activeTab === 'tenants' && <SuperAdminTenantsList themeColor={themeColor} />}
          {activeTab === 'payment-proofs' && <PaymentProofsQueue themeColor={themeColor} />}
          
          {/* Interconnexion réelle avec les 11 modules NestJS backend */}
          {activeTab === 'billing' && <SuperAdminBillingView themeColor={themeColor} />}
          {activeTab === 'pricing' && <PricingPlansView themeColor={themeColor} />}
          {activeTab === 'quotes' && <SaaSQuotesView themeColor={themeColor} />}
          {activeTab === 'payment-providers' && <ProviderManagerView type="payment" themeColor={themeColor} />}
          {activeTab === 'sms-providers' && <ProviderManagerView type="sms" themeColor={themeColor} />}
          {activeTab === 'analytics' && <AnalyticsView themeColor={themeColor} />}
          {activeTab === 'team' && <TeamManagerView themeColor={themeColor} />}
          {activeTab === 'audit' && <AuditLogsView themeColor={themeColor} />}
          {activeTab === 'security' && <SecurityCenterView themeColor={themeColor} />}
          {activeTab === 'about' && <AboutView themeColor={themeColor} />}
          {activeTab === 'ai-assistant' && <AiInventoryAuditManager themeColor={themeColor} sectorType="SUPER_ADMIN" />}
        </main>
      </div>

      <AiAssistantWidget themeColor={themeColor} sectorType="SUPER_ADMIN" />
    </div>
  );
};
