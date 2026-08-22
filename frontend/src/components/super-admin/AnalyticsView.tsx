import React, { useState, useEffect } from 'react';
import { SuperAdminApiService, AnalyticsOverviewData } from '../../services/super-admin-api.service';
import { KpiCard } from './KpiCard';
import { ForbiddenState } from './ForbiddenState';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface Props {
  themeColor?: string;
}

export const AnalyticsView: React.FC<Props> = ({ themeColor = '#312E81' }) => {
  const [analytics, setAnalytics] = useState<AnalyticsOverviewData | null>(null);
  const [sectors, setSectors] = useState<any[]>([]);
  const [acquisitionData, setAcquisitionData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, sectorsData, acquisition, revenue] = await Promise.all([
        SuperAdminApiService.getAnalyticsOverview(),
        SuperAdminApiService.getSectorAnalytics(),
        SuperAdminApiService.getAcquisitionTimeSeries(),
        SuperAdminApiService.getRevenueTimeSeries()
      ]);
      setAnalytics(overviewData);
      setSectors(sectorsData.sectors || []);
      setAcquisitionData(acquisition);
      setRevenueData(revenue);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des analytics BI.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement de la Business Intelligence...</div>;
  if (error?.includes('403')) return <ForbiddenState message="Seuls les rôles SUPER_ADMIN ont accès à l'intelligence BI et aux audiences." />;

  const COLORS = ['#059669', '#3B82F6', '#F59E0B', '#8B5CF6'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>📈 Business Intelligence & Audiences</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Indicateurs SaaS calculés côté serveur à partir des données réelles</p>
      </div>

      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <KpiCard
            title="Taux de Croissance Tenants"
            value={`${analytics.growth.value} tenants`}
            subtitle={analytics.growth.variation !== undefined ? `Variation: ${analytics.growth.variation}%` : undefined}
            icon="📊"
            status={analytics.growth.status as any}
          />
          <KpiCard
            title="ARPU (Revenu Moyen/Tenant)"
            value={`${analytics.arpu.value.toLocaleString()} ${analytics.arpu.currency}`}
            icon="💎"
            status={analytics.arpu.status as any}
          />
          <KpiCard
            title="Taux de Churn (Résiliation)"
            value={analytics.churn.value !== null ? `${analytics.churn.value}%` : 'Données insuffisantes'}
            subtitle={analytics.churn.explanation}
            icon="🔄"
            status={analytics.churn.status as any}
          />
          <KpiCard
            title="LTV (Lifetime Value)"
            value={analytics.ltv.value !== null ? `${analytics.ltv.value.toLocaleString()} ${analytics.ltv.currency}` : 'Données insuffisantes'}
            subtitle={analytics.ltv.explanation}
            icon="🎯"
            status={analytics.ltv.status as any}
          />
        </div>
      )}

      {/* Graphiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 24 }}>
        
        {/* Evolution du MRR */}
        <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 20 }}>Évolution du Revenu (MRR Cumulé)</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#94A3B8" />
                <YAxis tick={{fontSize: 12}} stroke="#94A3B8" />
                <Tooltip formatter={(value: number) => [`${value.toLocaleString()} XOF`, 'MRR']} />
                <Legend />
                <Line type="monotone" dataKey="mrr" stroke={themeColor} strokeWidth={3} dot={{r: 4, fill: themeColor}} activeDot={{r: 6}} name="MRR (XOF)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Acquisition Tenants */}
        <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 20 }}>Acquisition Nouveaux Tenants</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={acquisitionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#94A3B8" />
                <YAxis tick={{fontSize: 12}} stroke="#94A3B8" />
                <Tooltip />
                <Legend />
                <Bar dataKey="newTenants" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Nouveaux Locataires" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Répartition par Secteur */}
        <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 20 }}>Répartition par Secteur d'Activité</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectors}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="activeTenants"
                  nameKey="sectorType"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {sectors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
