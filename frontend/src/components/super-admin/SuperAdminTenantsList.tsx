import React, { useState, useEffect } from 'react';

interface TenantItem {
  id: string;
  name: string;
  code: string;
  sectorType: string;
  country: string;
  billingStatus: 'TRIAL_7D' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  subscriptionEndsAt?: string;
  createdAt: string;
  _count?: {
    users: number;
  };
}

interface Props {
  themeColor: string;
}

export const SuperAdminTenantsList: React.FC<Props> = ({ themeColor }) => {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const token = localStorage.getItem('kpsy_token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super-admin/tenants', { headers });
      if (res.ok) setTenants(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleToggleStatus = async (tenantId: string, currentStatus: string) => {
    setProcessingId(tenantId);
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchTenants();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: TenantItem['billingStatus']) => {
    const config: Record<string, { bg: string; color: string; label: string }> = {
      TRIAL_7D: { bg: '#FEF3C7', color: '#92400E', label: 'Essai (7J)' },
      ACTIVE: { bg: '#D1FAE5', color: '#065F46', label: 'Actif' },
      EXPIRED: { bg: '#FEE2E2', color: '#DC2626', label: 'Expiré' },
      SUSPENDED: { bg: '#F3F4F6', color: '#4B5563', label: 'Suspendu' },
    };
    const c = config[status] || config.TRIAL_7D;
    return (
      <span style={{ padding: '4px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.75rem', background: c.bg, color: c.color }}>
        {c.label}
      </span>
    );
  };

  const handlePurgeTests = async () => {
    if (!window.confirm('⚠️ CONFIRMATION PURGE : Voulez-vous vraiment supprimer définitivement TOUS les tenants d\'essai et conserver uniquement les 3 tenants de démonstration officiels (QNC-0001, ITS-0001, TLR-0001) ?')) return;

    try {
      const res = await fetch('/api/super-admin/tenants/purge-test', {
        method: 'POST',
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        alert(`✅ ${data.message}`);
        fetchTenants();
      }
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la purge.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: '#111827' }}>
            Gestion & Actions Individuelles sur les Tenants ({tenants.length})
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
            Liste exhaustive des comptes d'entreprises inscrites et contrôle des accès SaaS
          </p>
        </div>

        <button
          onClick={handlePurgeTests}
          style={{
            padding: '10px 18px',
            borderRadius: 8,
            border: 'none',
            background: '#DC2626',
            color: 'white',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
          }}
        >
          🧹 Purger Tous les Tenants Tests
        </button>
      </div>


      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Chargement des entreprises...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <tr>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Nom Entreprise</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Code Tenant</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Secteur</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Pays</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Statut Abonnement</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Utilisateurs</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
                    Aucune entreprise inscrite.
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700 }}>{t.name}</td>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: themeColor }}>{t.code}</td>
                    <td style={{ padding: '14px 18px' }}>{t.sectorType}</td>
                    <td style={{ padding: '14px 18px', fontWeight: 700 }}>{t.country}</td>
                    <td style={{ padding: '14px 18px' }}>{getStatusBadge(t.billingStatus)}</td>
                    <td style={{ padding: '14px 18px', color: '#6B7280' }}>{t._count?.users || 1} admin</td>
                    <td style={{ padding: '14px 18px' }}>
                      <button
                        disabled={processingId === t.id}
                        onClick={() => handleToggleStatus(t.id, t.billingStatus)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          background: t.billingStatus === 'ACTIVE' ? '#FEE2E2' : '#D1FAE5',
                          color: t.billingStatus === 'ACTIVE' ? '#DC2626' : '#065F46',
                          border: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {processingId === t.id ? '...' : t.billingStatus === 'ACTIVE' ? 'Suspendre 🛑' : 'Réactiver ✓'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
