import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number | string;
}

interface Props {
  sector: string;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  themeColor: string;
  tenantName: string;
}

export const Sidebar: React.FC<Props> = ({
  sector,
  activeTab,
  onTabChange,
  themeColor,
  tenantName,
}) => {
  const getNavItems = (): NavItem[] => {
    switch (sector) {
      case 'QUINCAILLERIE':
        return [
          { id: 'overview', label: 'Vue Globale', icon: '📊' },
          { id: 'stock', label: 'Inventaire & Stock', icon: '📦' },
          { id: 'sales', label: 'Ventes Comptoir (Caisse)', icon: '🛒' },
          { id: 'movements', label: 'Mouvements Stock', icon: '🔄' },
          { id: 'purchases', label: 'Achats Fournisseurs', icon: '🚚' },
          { id: 'reports', label: 'Rapports & Marges', icon: '📈' },
          { id: 'billing', label: 'Devis & Factures', icon: '📄' },
          { id: 'employees', label: 'Collaborateurs', icon: '👥' },
          { id: 'settings', label: 'Paramètres', icon: '⚙️' },
          { id: 'guide', label: 'Guide d\'Utilisation', icon: '📘' },
          { id: 'about', label: 'À Propos', icon: 'ℹ️' },
        ];

      case 'MULTISERVICES_IT':
        return [
          { id: 'overview', label: 'Vue Atelier & SAV', icon: '📊' },
          { id: 'tickets', label: 'Tickets SAV (TCK-2026)', icon: '🛠️' },
          { id: 'sla', label: 'Engagements SLA & Délai', icon: '⏱️' },
          { id: 'services', label: 'Catalogue Prestations', icon: '💻' },
          { id: 'sales', label: 'Vente / Achat Matériel', icon: '🛒' },
          { id: 'stock', label: 'Stock Pièces Détachées', icon: '📦' },
          { id: 'customers', label: 'Suivi Client / SAV', icon: '👥' },
          { id: 'billing', label: 'Devis & Factures', icon: '📄' },
          { id: 'employees', label: 'Collaborateurs', icon: '👥' },
          { id: 'settings', label: 'Paramètres', icon: '⚙️' },
          { id: 'guide', label: 'Guide d\'Utilisation', icon: '📘' },
          { id: 'about', label: 'À Propos', icon: 'ℹ️' },
        ];

      case 'TAILLEUR':
        return [
          { id: 'overview', label: 'Vue Atelier', icon: '📊' },
          { id: 'measurements', label: 'Mesures Clients', icon: '📐' },
          { id: 'orders', label: 'Commandes Confection', icon: '✂️' },
          { id: 'fittings', label: 'Rendez-vous & Essayages', icon: '📅' },
          { id: 'services', label: 'Catalogue Modèles', icon: '👗' },
          { id: 'billing', label: 'Devis & Factures', icon: '📄' },
          { id: 'employees', label: 'Collaborateurs', icon: '👥' },
          { id: 'settings', label: 'Paramètres', icon: '⚙️' },
          { id: 'guide', label: 'Guide d\'Utilisation', icon: '📘' },
          { id: 'about', label: 'À Propos', icon: 'ℹ️' },
        ];



      case 'SUPER_ADMIN':
        return [
          { id: 'overview', label: 'Statistiques SaaS', icon: '📊' },
          { id: 'tenants', label: 'Gestion Tenants', icon: '🏢' },
          { id: 'payment-proofs', label: 'Preuves de Paiement', icon: '💳' },
        ];
      default:
        return [{ id: 'overview', label: 'Vue Globale', icon: '📊' }];
    }
  };

  const items = getNavItems();

  return (
    <aside
      style={{
        width: 260,
        background: '#0F172A',
        color: 'white',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #1E293B',
        flexShrink: 0,
      }}
    >
      {/* Brand Top */}
      <div
        style={{
          padding: '24px 20px',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: themeColor,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.1rem',
          }}
        >
          K
        </div>
        <div>
          <div
            style={{
              fontFamily: "'Sora', sans-serif",
              fontWeight: 800,
              fontSize: '0.92rem',
              color: 'white',
              letterSpacing: '-0.02em',
            }}
          >
            KPSyDesk Suite - Door Waar
          </div>

          <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
            {sector.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', padding: '8px 12px', letterSpacing: '0.05em' }}>
          Menu Principal
        </div>
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 14px',
                borderRadius: 10,
                border: 'none',
                background: isActive ? themeColor : 'transparent',
                color: isActive ? 'white' : '#94A3B8',
                fontWeight: isActive ? 700 : 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.05rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.2)' : '#1E293B',
                    color: isActive ? 'white' : '#94A3B8',
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontWeight: 700,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid #1E293B',
          fontSize: '0.72rem',
          color: '#64748B',
        }}
      >
        <div>Client : <strong>{tenantName}</strong></div>
        <div style={{ marginTop: 2, color: '#475569' }}>Zone UEMOA (XOF)</div>
      </div>
    </aside>
  );
};
