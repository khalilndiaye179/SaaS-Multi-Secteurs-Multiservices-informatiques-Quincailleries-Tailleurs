import { StorageService } from '../../services/storage';
import React, { useState, useEffect } from 'react';

interface GlobalStats {
  totalTenants: number;
  trialTenants: number;
  activeTenants: number;
  expiredTenants: number;
  suspendedTenants: number;
  pendingProofsCount: number;
  totalInvoicesVolumeXOF: number;
  totalQuincaillerieSalesXOF: number;
  sectorBreakdown: {
    QUINCAILLERIE: number;
    MULTISERVICES_IT: number;
    TAILLEUR: number;
  };
  countryBreakdown: {
    SN: number;
    CI: number;
    ML: number;
  };
}

interface Props {
  themeColor: string;
}

export const SuperAdminMetricsDashboard: React.FC<Props> = ({ themeColor }) => {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      let token;
    StorageService.get("kpsy_token").then(t => token = t);
    // FIXME: token fetch is now async, might break sync logic
      try {
        const res = await fetch('/api/super-admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setStats(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: 'var(--text-main)' }}>
          Vue Consolidée SaaS Multi-Secteurs UEMOA
        </h2>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Statistiques d'abonnements, volumes financiers consolidés en XOF et file de validation des paiements
        </p>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des métriques globales...</div>
      ) : (
        <>
          {/* Cartes Clés */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Entreprises Inscrites</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4, fontFamily: "'Sora', sans-serif" }}>
                {stats?.totalTenants || 0}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: 4, fontWeight: 700 }}>
                {stats?.activeTenants || 0} Actives / {stats?.trialTenants || 0} Trial
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Paiements en Attente</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4, color: '#D97706', fontFamily: "'Sora', sans-serif" }}>
                {stats?.pendingProofsCount || 0}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#D97706', marginTop: 4, fontWeight: 700 }}>Preuves Wave / OM</div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Volume Facturé Consolidé</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 6, color: themeColor, fontFamily: "'Sora', sans-serif" }}>
                {stats?.totalInvoicesVolumeXOF?.toLocaleString() || 0} XOF
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Devis & Factures</div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ventes Quincaillerie XOF</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 6, color: '#059669', fontFamily: "'Sora', sans-serif" }}>
                {stats?.totalQuincaillerieSalesXOF?.toLocaleString() || 0} XOF
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Total Caisse direct</div>
            </div>
          </div>

          {/* Répartition par Secteur */}
          <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 700 }}>Répartition par Secteur d'Activité</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ background: '#ECFDF5', padding: 16, borderRadius: 10, border: '1px solid #A7F3D0' }}>
                <div style={{ fontWeight: 700, color: '#065F46' }}>🔧 Quincailleries</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857', marginTop: 4 }}>
                  {stats?.sectorBreakdown?.QUINCAILLERIE || 0}
                </div>
              </div>
              <div style={{ background: '#CCFBF1', padding: 16, borderRadius: 10, border: '1px solid #99F6E4' }}>
                <div style={{ fontWeight: 700, color: '#0F766E' }}>💻 Multiservices IT</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0D9488', marginTop: 4 }}>
                  {stats?.sectorBreakdown?.MULTISERVICES_IT || 0}
                </div>
              </div>
              <div style={{ background: '#F3E8FF', padding: 16, borderRadius: 10, border: '1px solid #E9D5FF' }}>
                <div style={{ fontWeight: 700, color: '#6B21A8' }}>🧵 Tailleurs / Couture</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7E22CE', marginTop: 4 }}>
                  {stats?.sectorBreakdown?.TAILLEUR || 0}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
