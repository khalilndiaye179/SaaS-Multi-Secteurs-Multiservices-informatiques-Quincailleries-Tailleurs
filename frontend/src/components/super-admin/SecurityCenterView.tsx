import React, { useState, useEffect } from 'react';
import { SuperAdminApiService, SecurityOverviewData } from '../../services/super-admin-api.service';
import { ForbiddenState } from './ForbiddenState';

interface Props {
  themeColor?: string;
}

export const SecurityCenterView: React.FC<Props> = ({ themeColor = '#312E81' }) => {
  const [data, setData] = useState<SecurityOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSecurity();
  }, []);

  const fetchSecurity = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await SuperAdminApiService.getSecurityOverview();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inspection de sécurité.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Inspection technique de sécurité...</div>;
  if (error?.includes('403')) return <ForbiddenState message="Seuls les rôles SUPER_ADMIN ont accès au Centre de Sécurité et Dépendances." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>🛡️ Sécurité & Dépendances (Read-Only Inspection)</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Contrôles réels d'isolation multi-tenant, chiffrement, RBAC et dépendances</p>
        </div>
        {data && (
          <span
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
              background: data.status === 'HEALTHY' ? '#DCFCE7' : data.status === 'WARNING' ? '#FEF3C7' : '#FEE2E2',
              color: data.status === 'HEALTHY' ? '#166534' : data.status === 'WARNING' ? '#D97706' : '#991B1B',
            }}
          >
            Statut Système : {data.status}
          </span>
        )}
      </div>

      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {data.checks.map((c) => (
            <div key={c.id} style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0F172A' }}>{c.name}</h3>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    background: c.status === 'PASS' ? '#DCFCE7' : c.status === 'NOT_CONFIGURED' ? '#FEF3C7' : '#FEE2E2',
                    color: c.status === 'PASS' ? '#166534' : c.status === 'NOT_CONFIGURED' ? '#D97706' : '#991B1B',
                  }}
                >
                  {c.status}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{c.description}</p>
              <div style={{ fontSize: 12, background: 'var(--bg-main)', padding: '8px 12px', borderRadius: 6, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                <strong>Evidence :</strong> {c.evidence}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
