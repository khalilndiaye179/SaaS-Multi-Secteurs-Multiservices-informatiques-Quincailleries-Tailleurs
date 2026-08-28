import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface TenantRow {
  id: string;
  code: string;
  name: string;
  sectorType: 'QUINCAILLERIE' | 'MULTISERVICES_IT' | 'TAILLEUR';
  country: 'SN' | 'CI' | 'ML';
  billingStatus: 'TRIAL_7D' | 'ACTIVE' | 'SUSPENDED';
  userCount: number;
  createdAt: string;
}

export const SuperAdminDashboard: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchTenants = async () => {
      try {
        const token = localStorage.getItem('kpsy_token');
        const res = await fetch('/api/super-admin/tenants', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Map backend data to frontend structure if needed
          const mapped = data
            .filter((t: any) => t.code !== 'KPSY-ADMIN' && t.code !== 'SAAS-GLOBAL')
            .map((t: any) => ({
            id: t.id,
            code: t.code,
            name: t.name,
            sectorType: t.sectorType,
            country: t.country,
            billingStatus: t.billingStatus,
            userCount: t.users?.length || 0,
            createdAt: new Date(t.createdAt).toISOString().split('T')[0],
          }));
          setTenants(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch tenants', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTenants();
  }, []);
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('ALL');

  const filteredTenants = tenants.filter(
    (t) => selectedSectorFilter === 'ALL' || t.sectorType === selectedSectorFilter
  );

  const toggleStatus = (id: string) => {
    setTenants((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, billingStatus: t.billingStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }
          : t
      )
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] p-8 space-y-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1B4D3E] to-[#0F3D2E] border border-[#D9A441]/40 flex items-center justify-center font-['Sora'] font-bold text-2xl text-[#D9A441] shadow-lg">
            K
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-['Sora'] font-extrabold text-[var(--text-main)]">Super Admin Dashboard</h1>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#D9A441]/20 text-[#D9A441] border border-[#D9A441]/30">
                KPSyDesk Suite - Door Waar Global
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">Supervision globale multi-tenant & validation des abonnements UEMOA</p>
          </div>
        </div>
        
        <button
          onClick={toggleTheme}
          title="Basculer le thème"
          className="text-2xl p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[var(--bg-card)]/80 border border-[var(--border-color)] rounded-2xl p-6">
          <span className="text-xs font-medium text-[var(--text-muted)]">Total Tenants</span>
          <div className="text-3xl font-extrabold text-[var(--text-main)] mt-2">{tenants.length}</div>
        </div>

        <div className="bg-[var(--bg-card)]/80 border border-[#D9A441]/30 rounded-2xl p-6">
          <span className="text-xs font-medium text-[#D9A441]">Essais Actifs (Trial 7D)</span>
          <div className="text-3xl font-extrabold text-[#D9A441] mt-2">
            {tenants.filter((t) => t.billingStatus === 'TRIAL_7D').length}
          </div>
        </div>

        <div className="bg-[var(--bg-card)]/80 border border-emerald-500/30 rounded-2xl p-6">
          <span className="text-xs font-medium text-emerald-400">Abonnements Actifs</span>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">
            {tenants.filter((t) => t.billingStatus === 'ACTIVE').length}
          </div>
        </div>

        <div className="bg-[var(--bg-card)]/80 border border-red-500/30 rounded-2xl p-6">
          <span className="text-xs font-medium text-red-400">Suspendus</span>
          <div className="text-3xl font-extrabold text-red-400 mt-2">
            {tenants.filter((t) => t.billingStatus === 'SUSPENDED').length}
          </div>
        </div>
      </div>

      {/* Sector Filter & Tenants Table */}
      <div className="bg-[var(--bg-card)]/90 border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-['Sora'] font-bold text-[var(--text-main)]">Liste des Entreprises & Ateliers</h3>

          <div className="flex items-center gap-2 bg-[var(--bg-main)] p-1.5 rounded-xl border border-[var(--border-color)] text-xs">
            <button
              onClick={() => setSelectedSectorFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${selectedSectorFilter === 'ALL' ? 'bg-[#1B4D3E] text-[var(--text-main)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              Tous
            </button>
            <button
              onClick={() => setSelectedSectorFilter('QUINCAILLERIE')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${selectedSectorFilter === 'QUINCAILLERIE' ? 'bg-[#D9A441] text-[#090D16] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              🔩 Quincailleries
            </button>
            <button
              onClick={() => setSelectedSectorFilter('MULTISERVICES_IT')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${selectedSectorFilter === 'MULTISERVICES_IT' ? 'bg-[#14B8A6] text-[#090D16] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              💻 Multiservices IT
            </button>
            <button
              onClick={() => setSelectedSectorFilter('TAILLEUR')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${selectedSectorFilter === 'TAILLEUR' ? 'bg-[#E07A5F] text-[var(--text-main)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              ✂️ Tailleurs
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-[var(--text-muted)] bg-[var(--bg-main)]/80 uppercase border-b border-[var(--border-color)]">
              <tr>
                <th className="py-4 px-4">Code</th>
                <th className="py-4 px-4">Entreprise</th>
                <th className="py-4 px-4">Secteur</th>
                <th className="py-4 px-4">Pays</th>
                <th className="py-4 px-4">Utilisateurs</th>
                <th className="py-4 px-4">Statut Abonnement</th>
                <th className="py-4 px-4 text-right">Actions Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTenants.map((t) => (
                <tr key={t.id} className="hover:bg-[var(--bg-card)]/30 transition-colors">
                  <td className="py-4 px-4 font-mono text-xs text-[#D9A441] font-bold">{t.code}</td>
                  <td className="py-4 px-4 font-semibold text-[var(--text-main)]">{t.name}</td>
                  <td className="py-4 px-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[var(--bg-card)] text-slate-300 border border-[var(--border-color)]">
                      {t.sectorType}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-xs font-bold">
                    {t.country === 'SN' && '🇸🇳 Sénégal'}
                    {t.country === 'CI' && '🇨🇮 Côte d\'Ivoire'}
                    {t.country === 'ML' && '🇲🇱 Mali'}
                  </td>
                  <td className="py-4 px-4 text-slate-300">{t.userCount} utilisateur(s)</td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        t.billingStatus === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : t.billingStatus === 'TRIAL_7D'
                          ? 'bg-[#D9A441]/20 text-[#D9A441] border border-[#D9A441]/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {t.billingStatus}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => toggleStatus(t.id)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                        t.billingStatus === 'ACTIVE'
                          ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {t.billingStatus === 'ACTIVE' ? 'Suspendre' : 'Valider Paiement (Activer)'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
