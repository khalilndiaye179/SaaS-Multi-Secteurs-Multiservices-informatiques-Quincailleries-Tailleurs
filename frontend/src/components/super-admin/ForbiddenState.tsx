import React from 'react';

interface ForbiddenStateProps {
  message?: string;
}

export const ForbiddenState: React.FC<ForbiddenStateProps> = ({
  message = "Accès refusé : Vous n'avez pas les privilèges nécessaires pour accéder à ce module de la Console SaaS Super Admin.",
}) => {
  return (
    <div
      style={{
        padding: '48px 32px',
        textAlign: 'center',
        background: '#FFF5F5',
        border: '1px solid #FEB2B2',
        borderRadius: 12,
        margin: '24px 0',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#C53030', marginBottom: 8 }}>
        403 — Accès Restreint par la Sécurité Serveur
      </h3>
      <p style={{ fontSize: 14, color: '#742A2A', maxWidth: 540, margin: '0 auto 20px' }}>
        {message}
      </p>
      <div
        style={{
          display: 'inline-block',
          padding: '6px 16px',
          background: '#C53030',
          color: 'var(--text-inverse)',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Fail-Closed RBAC Active
      </div>
    </div>
  );
};
