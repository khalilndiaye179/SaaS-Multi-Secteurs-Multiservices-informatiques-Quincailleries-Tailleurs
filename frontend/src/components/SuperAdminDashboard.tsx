import React, { useState } from 'react';
import { Sidebar } from './layout/Sidebar';
import { TopHeader } from './layout/TopHeader';
import { SuperAdminMetricsDashboard } from './super-admin/SuperAdminMetricsDashboard';
import { PaymentProofsQueue } from './super-admin/PaymentProofsQueue';
import { SuperAdminTenantsList } from './super-admin/SuperAdminTenantsList';

interface Props {
  onLogout: () => void;
}

export const SuperAdminDashboard: React.FC<Props> = ({ onLogout }) => {
  const user = JSON.parse(localStorage.getItem('kpsy_user') || '{}');
  const [activeTab, setActiveTab] = useState('overview');
  const themeColor = '#312E81';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAF9', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
        />

        <main style={{ padding: '32px 36px', maxWidth: 1280, width: '100%', margin: '0 auto' }}>
          {activeTab === 'overview' && <SuperAdminMetricsDashboard themeColor={themeColor} />}
          {activeTab === 'tenants' && <SuperAdminTenantsList themeColor={themeColor} />}
          {activeTab === 'payment-proofs' && <PaymentProofsQueue themeColor={themeColor} />}
        </main>
      </div>
    </div>
  );
};
