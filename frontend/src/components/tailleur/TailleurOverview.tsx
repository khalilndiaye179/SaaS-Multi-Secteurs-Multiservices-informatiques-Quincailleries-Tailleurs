import React, { useEffect, useState } from 'react';

interface TailleurStats {
  totalOrdersCount: number;
  inConfectionCount: number;
  totalAdvancesXOF: number;
  totalPendingBalanceXOF: number;
}

interface Props {
  themeColor: string;
}

export const TailleurOverview: React.FC<Props> = ({ themeColor }) => {
  const [stats, setStats] = useState<TailleurStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('kpsy_token');
        const res = await fetch('/api/tailleur/measurements/stats/overview', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des stats tailleur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des statistiques...</div>;
  }

  if (!stats) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#EF4444' }}>Impossible de charger les statistiques.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: 'var(--text-main)' }}>
        Vue d'ensemble - Atelier de Couture
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {/* Total Commandes */}
        <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 14, border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.5rem' }}>👗</span>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total Commandes</div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: 12, fontFamily: "'Sora', sans-serif", color: 'var(--text-main)' }}>
            {stats.totalOrdersCount.toLocaleString()}
          </div>
        </div>

        {/* En cours de confection */}
        <div style={{ background: stats.inConfectionCount > 0 ? '#EFF6FF' : 'white', padding: 24, borderRadius: 14, border: `1px solid ${stats.inConfectionCount > 0 ? '#BFDBFE' : '#E5E7EB'}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.5rem' }}>✂️</span>
            <div style={{ fontSize: '0.82rem', color: stats.inConfectionCount > 0 ? '#1D4ED8' : '#6B7280', fontWeight: 700 }}>En Atelier (Coupe/Couture)</div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: 12, fontFamily: "'Sora', sans-serif", color: stats.inConfectionCount > 0 ? '#2563EB' : '#111827' }}>
            {stats.inConfectionCount.toLocaleString()}
          </div>
        </div>

        {/* Avances Perçues */}
        <div style={{ background: `linear-gradient(135deg, ${themeColor}10, ${themeColor}20)`, padding: 24, borderRadius: 14, border: `1px solid ${themeColor}30`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.5rem' }}>💵</span>
            <div style={{ fontSize: '0.82rem', color: themeColor, fontWeight: 700 }}>Avances Perçues</div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 12, fontFamily: "'Sora', sans-serif", color: themeColor }}>
            {stats.totalAdvancesXOF.toLocaleString()} <span style={{ fontSize: '1rem', opacity: 0.8 }}>XOF</span>
          </div>
        </div>

        {/* Soldes Restants */}
        <div style={{ background: stats.totalPendingBalanceXOF > 0 ? '#FEF2F2' : 'white', padding: 24, borderRadius: 14, border: `1px solid ${stats.totalPendingBalanceXOF > 0 ? '#FCA5A5' : '#E5E7EB'}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.5rem' }}>⏳</span>
            <div style={{ fontSize: '0.82rem', color: stats.totalPendingBalanceXOF > 0 ? '#991B1B' : '#6B7280', fontWeight: 700 }}>Soldes à Percevoir</div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 12, fontFamily: "'Sora', sans-serif", color: stats.totalPendingBalanceXOF > 0 ? '#DC2626' : '#111827' }}>
            {stats.totalPendingBalanceXOF.toLocaleString()} <span style={{ fontSize: '1rem', color: stats.totalPendingBalanceXOF > 0 ? '#F87171' : '#9CA3AF' }}>XOF</span>
          </div>
        </div>
      </div>
    </div>
  );
};
