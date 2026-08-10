import React from 'react';

interface Props {
  tenantName: string;
  tenantCode: string;
  sector: string;
  userName?: string;
  themeColor: string;
  onLogout: () => void;
}

export const TopHeader: React.FC<Props> = ({
  tenantName,
  tenantCode,
  sector,
  userName,
  themeColor,
  onLogout,
}) => {
  const getSectorIcon = () => {
    switch (sector) {
      case 'QUINCAILLERIE':
        return '🔧';
      case 'MULTISERVICES_IT':
        return '💻';
      case 'TAILLEUR':
        return '🧵';
      case 'SUPER_ADMIN':
        return '👑';
      default:
        return '🏢';
    }
  };

  return (
    <header
      style={{
        background: 'white',
        borderBottom: '1px solid #E5E7EB',
        padding: '14px 32px',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: themeColor,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.2rem',
            fontFamily: "'Sora', sans-serif",
          }}
        >
          {getSectorIcon()}
        </div>
        <div>
          <h1
            style={{
              fontFamily: "'Sora', sans-serif",
              fontWeight: 800,
              fontSize: '1.1rem',
              color: '#111827',
              margin: 0,
            }}
          >
            {tenantName}
          </h1>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: themeColor }}>
            Secteur : {sector}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#374151' }}>
            {userName || 'Utilisateur'}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>Code: {tenantCode}</div>
        </div>
        <button
          onClick={onLogout}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            background: '#F3F4F6',
            color: '#4B5563',
            border: '1px solid #E5E7EB',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'all 200ms ease',
          }}
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
};
