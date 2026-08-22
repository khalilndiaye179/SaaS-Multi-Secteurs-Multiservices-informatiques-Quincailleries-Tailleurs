import React, { useState, useEffect } from 'react';
import { SuperAdminApiService, AuditLogItemData } from '../../services/super-admin-api.service';
import { ForbiddenState } from './ForbiddenState';

interface Props {
  themeColor?: string;
}

export const AuditLogsView: React.FC<Props> = ({ themeColor = '#312E81' }) => {
  const [logs, setLogs] = useState<AuditLogItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await SuperAdminApiService.getAuditLogs();
      setLogs(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des journaux d\'audit.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement du journal d'audit immuable...</div>;
  if (error?.includes('403')) return <ForbiddenState message="Seuls les rôles SUPER_ADMIN et AUDITOR ont accès à la consultation du Journal d'Audit." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>📜 Journal d'Audit Centralisé (Immuable)</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Traçabilité complète Append-Only sans aucune possibilité de modification ou suppression</p>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '14px 20px' }}>Horodatage (UTC)</th>
              <th style={{ padding: '14px 20px' }}>Acteur</th>
              <th style={{ padding: '14px 20px' }}>Rôle</th>
              <th style={{ padding: '14px 20px' }}>Action</th>
              <th style={{ padding: '14px 20px' }}>Ressource</th>
              <th style={{ padding: '14px 20px' }}>Résultat</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Aucun événement d'audit enregistré.
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 13 }}>{new Date(l.createdAt).toLocaleString()}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>{l.actorUserId}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ padding: '2px 8px', background: 'var(--bg-main)', color: 'var(--text-muted)', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                      {l.actorRole}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: themeColor }}>{l.action}</td>
                  <td style={{ padding: '14px 20px' }}>{l.resourceType} ({l.resourceId.substring(0, 8)}...)</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: l.result === 'SUCCESS' ? '#DCFCE7' : '#FEE2E2', color: l.result === 'SUCCESS' ? '#166534' : '#991B1B' }}>
                      {l.result}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
