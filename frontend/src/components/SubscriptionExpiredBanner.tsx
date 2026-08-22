import React from 'react';
import { SubscriptionRenewalPanel } from './shared/SubscriptionRenewalPanel';

interface Props {
  tenantName: string;
  tenantCode: string;
  onSubmitted: () => void;
  onLogout: () => void;
}

export const SubscriptionExpiredBanner: React.FC<Props> = ({
  tenantName,
  tenantCode,
  onSubmitted,
  onLogout,
}) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: 'var(--text-inverse)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: '#1E293B',
          borderRadius: 20,
          border: '1px solid rgba(239, 68, 68, 0.3)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          maxWidth: 540,
          width: '100%',
          padding: '36px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #EF4444',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              margin: '0 auto 16px auto',
            }}
          >
            🔒
          </div>
          <h2
            style={{
              fontFamily: "'Sora', sans-serif",
              fontWeight: 800,
              fontSize: '1.4rem',
              marginBottom: 8,
              color: '#F87171',
            }}
          >
            Abonnement Expiré ou Suspendu
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            L’accès à l'espace métier <strong>{tenantName}</strong> ({tenantCode}) est actuellement verrouillé.
          </p>
        </div>

        {/* Panneau réutilisable de renouvellement et soumission de preuve */}
        <SubscriptionRenewalPanel onSubmitted={onSubmitted} compact />

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            onClick={onLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};
