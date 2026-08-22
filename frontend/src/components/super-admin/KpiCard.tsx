import React from 'react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  themeColor?: string;
  status?: 'AVAILABLE' | 'INSUFFICIENT_DATA' | 'NOT_APPLICABLE' | 'LOADING';
}

export const KpiCard: React.FC<Props> = ({
  title,
  value,
  subtitle,
  icon = '📊',
  themeColor = '#312E81',
  status = 'AVAILABLE',
}) => {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 12,
        padding: '20px 24px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>

      <div>
        {status === 'INSUFFICIENT_DATA' ? (
          <div style={{ fontSize: 14, fontWeight: 600, color: '#D97706', background: '#FEF3C7', padding: '4px 8px', borderRadius: 6, display: 'inline-block' }}>
            Données insuffisantes
          </div>
        ) : status === 'NOT_APPLICABLE' ? (
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-main)', padding: '4px 8px', borderRadius: 6, display: 'inline-block' }}>
            Non applicable
          </div>
        ) : (
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            {value}
          </div>
        )}

        {subtitle && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};
