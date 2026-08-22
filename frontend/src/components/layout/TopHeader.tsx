import React from 'react';
import { NotificationBell } from '../shared/NotificationBell';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  tenantName: string;
  tenantCode: string;
  sector: string;
  userName?: string;
  themeColor: string;
  onLogout: () => void;
  isSuperAdmin?: boolean;
}

export const TopHeader: React.FC<Props> = ({
  tenantName,
  tenantCode,
  sector,
  userName,
  themeColor,
  onLogout,
  isSuperAdmin = false,
}) => {
  const { theme, toggleTheme } = useTheme();

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
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        padding: '14px 32px',
        display: 'flex',
        justifyContent: 'space-between',
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
            color: 'var(--text-inverse)',
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
              color: 'var(--text-main)',
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
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-main)' }}>
            {userName || 'Utilisateur'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Code: {tenantCode}</div>
        </div>
        
        <button
          onClick={toggleTheme}
          title="Basculer le thème"
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <NotificationBell
          mode={isSuperAdmin ? 'super-admin' : 'tenant'}
          themeColor={themeColor}
        />
        <button
          onClick={onLogout}
          style={{
            padding: '8px 16px',
            background: '#FEE2E2',
            color: '#DC2626',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
};
