import { StorageService } from '../../services/storage';
import React, { useEffect, useState } from 'react';

interface QuincaillerieStats {
  totalItemsCount: number;
  totalPurchaseValueXOF: number;
  totalSellingValueXOF: number;
  potentialMarginXOF: number;
  itemsInAlertCount: number;
}

interface Props {
  themeColor: string;
}

export const QuincaillerieOverview: React.FC<Props> = ({ themeColor }) => {
  const [stats, setStats] = useState<QuincaillerieStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        let token;
    StorageService.get("kpsy_token").then(t => token = t);
    // FIXME: token fetch is now async, might break sync logic
        const res = await fetch('/api/quincaillerie/stock/reports', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des stats de quincaillerie:', error);
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
        Vue d'ensemble - Quincaillerie
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {/* Total Articles */}
        <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 14, border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.5rem' }}>📦</span>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>Articles en Stock</div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: 12, fontFamily: "'Sora', sans-serif", color: 'var(--text-main)' }}>
            {stats.totalItemsCount.toLocaleString()}
          </div>
        </div>

        {/* Valeur d'achat */}
        <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 14, border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.5rem' }}>💰</span>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>Valeur d'Achat (Total)</div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 12, fontFamily: "'Sora', sans-serif", color: 'var(--text-muted)' }}>
            {stats.totalPurchaseValueXOF.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>XOF</span>
          </div>
        </div>

        {/* Valeur de vente & Marge */}
        <div style={{ background: `linear-gradient(135deg, ${themeColor}10, ${themeColor}20)`, padding: 24, borderRadius: 14, border: `1px solid ${themeColor}30`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.5rem' }}>📈</span>
            <div style={{ fontSize: '0.82rem', color: themeColor, fontWeight: 700 }}>Valeur de Vente & Marge</div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 12, fontFamily: "'Sora', sans-serif", color: themeColor }}>
            {stats.totalSellingValueXOF.toLocaleString()} <span style={{ fontSize: '1rem', opacity: 0.8 }}>XOF</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, marginTop: 4 }}>
            + {stats.potentialMarginXOF.toLocaleString()} XOF de marge estimée
          </div>
        </div>

        {/* Alertes Stock */}
        <div style={{ background: stats.itemsInAlertCount > 0 ? '#FEF2F2' : 'white', padding: 24, borderRadius: 14, border: `1px solid ${stats.itemsInAlertCount > 0 ? '#FCA5A5' : '#E5E7EB'}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div style={{ fontSize: '0.82rem', color: stats.itemsInAlertCount > 0 ? '#991B1B' : '#6B7280', fontWeight: 700 }}>Alertes Rupture</div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: 12, fontFamily: "'Sora', sans-serif", color: stats.itemsInAlertCount > 0 ? '#DC2626' : '#111827' }}>
            {stats.itemsInAlertCount}
          </div>
          {stats.itemsInAlertCount > 0 && (
            <div style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600, marginTop: 4 }}>
              Vérifiez l'onglet "Stock"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
