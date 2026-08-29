import { StorageService } from '../../services/storage';
import React, { useEffect, useState } from 'react';

interface ITStats {
  totalTicketsCount: number;
  activeInWorkshopCount: number;
  readyForPickupCount: number;
  totalRevenueXOF: number;
}

interface Props {
  themeColor: string;
}

export const ITOverview: React.FC<Props> = ({ themeColor }) => {
  const [stats, setStats] = useState<ITStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        let token;
    StorageService.get("kpsy_token").then(t => token = t);
    // FIXME: token fetch is now async, might break sync logic
        const res = await fetch('/api/multiservices-it/tickets/stats/overview', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des stats IT:', error);
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
        Vue d'ensemble - Atelier Informatique
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {/* Total Tickets */}
        <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 14, border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.5rem' }}>🎫</span>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total Tickets</div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: 12, fontFamily: "'Sora', sans-serif", color: 'var(--text-main)' }}>
            {stats.totalTicketsCount.toLocaleString()}
          </div>
        </div>

        {/* En Atelier */}
        <div style={{ background: stats.activeInWorkshopCount > 0 ? '#FEF3C7' : 'white', padding: 24, borderRadius: 14, border: `1px solid ${stats.activeInWorkshopCount > 0 ? '#FDE68A' : '#E5E7EB'}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.5rem' }}>🔧</span>
            <div style={{ fontSize: '0.82rem', color: stats.activeInWorkshopCount > 0 ? '#92400E' : '#6B7280', fontWeight: 700 }}>Appareils en Atelier</div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: 12, fontFamily: "'Sora', sans-serif", color: stats.activeInWorkshopCount > 0 ? '#B45309' : '#111827' }}>
            {stats.activeInWorkshopCount.toLocaleString()}
          </div>
        </div>
        
        {/* Prêts à retirer */}
        <div style={{ background: stats.readyForPickupCount > 0 ? '#ECFCCB' : 'white', padding: 24, borderRadius: 14, border: `1px solid ${stats.readyForPickupCount > 0 ? '#D9F99D' : '#E5E7EB'}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.5rem' }}>✅</span>
            <div style={{ fontSize: '0.82rem', color: stats.readyForPickupCount > 0 ? '#3F6212' : '#6B7280', fontWeight: 700 }}>Prêts à Retirer</div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: 12, fontFamily: "'Sora', sans-serif", color: stats.readyForPickupCount > 0 ? '#4D7C0F' : '#111827' }}>
            {stats.readyForPickupCount.toLocaleString()}
          </div>
        </div>

        {/* CA Généré */}
        <div style={{ background: `linear-gradient(135deg, ${themeColor}10, ${themeColor}20)`, padding: 24, borderRadius: 14, border: `1px solid ${themeColor}30`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.5rem' }}>💎</span>
            <div style={{ fontSize: '0.82rem', color: themeColor, fontWeight: 700 }}>CA Réparations (Livré)</div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 12, fontFamily: "'Sora', sans-serif", color: themeColor }}>
            {stats.totalRevenueXOF.toLocaleString()} <span style={{ fontSize: '1rem', opacity: 0.8 }}>XOF</span>
          </div>
        </div>
      </div>
    </div>
  );
};
