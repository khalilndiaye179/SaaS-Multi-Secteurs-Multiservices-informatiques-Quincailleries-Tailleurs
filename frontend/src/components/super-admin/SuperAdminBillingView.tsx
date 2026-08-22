import React, { useState, useEffect } from 'react';
import { SuperAdminApiService, BillingOverviewData } from '../../services/super-admin-api.service';
import { ApiClient } from '../../services/api-client';
import { KpiCard } from './KpiCard';
import { ForbiddenState } from './ForbiddenState';

interface Props {
  themeColor?: string;
}

export const SuperAdminBillingView: React.FC<Props> = ({ themeColor = '#312E81' }) => {
  const [data, setData] = useState<BillingOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [activeProviders, setActiveProviders] = useState<{provider: string, displayName: string}[]>([]);
  const [pricingOptions, setPricingOptions] = useState<any[]>([]);
  const [manualForm, setManualForm] = useState({
    tenantId: '',
    amount: 6500,
    durationMonths: 1,
    paymentMethod: 'WAVE',
    transactionRef: '',
  });

  useEffect(() => {
    fetchBilling();
  }, []);

  const fetchBilling = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await SuperAdminApiService.getBillingOverview();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données financières.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'invoices' | 'payments' | 'tenants') => {
    try {
      const csvText = await SuperAdminApiService.exportBillingCsv(type);
      const blob = new Blob([csvText], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `saas-financial-${type}.csv`;
      a.click();
    } catch (err: any) {
      alert(`Échec de l'export CSV : ${err.message}`);
    }
  };

  const handleOpenManualModal = async () => {
    setIsManualModalOpen(true);
    try {
      const token = localStorage.getItem('kpsy_token');
      const [res, providers, pricingRes] = await Promise.all([
        fetch('/api/super-admin/tenants', { headers: { Authorization: `Bearer ${token}` } }),
        ApiClient.get<{provider: string, displayName: string}[]>('/api/payment-providers/active'),
        fetch('/api/business-billing/pricing-plans')
      ]);
      const data = await res.json();
      setTenants(data);
      setActiveProviders(providers);
      
      let fetchedPlans: any[] = [];
      if (pricingRes.ok) {
        const pData = await pricingRes.json();
        fetchedPlans = pData.plans || [];
        setPricingOptions(fetchedPlans);
      }

      if (data.length > 0) {
        setManualForm((prev) => ({ ...prev, tenantId: data[0].id }));
      }
      if (providers.length > 0) {
        setManualForm((prev) => ({ ...prev, paymentMethod: providers[0].provider }));
      }
      if (fetchedPlans.length > 0) {
        const defaultPlan = fetchedPlans.find((p: any) => p.durationMonths === 1) || fetchedPlans[0];
        setManualForm((prev) => ({ 
          ...prev, 
          durationMonths: defaultPlan.durationMonths, 
          amount: defaultPlan.finalAmount 
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.tenantId) {
      alert('Veuillez sélectionner un tenant.');
      return;
    }

    try {
      const token = localStorage.getItem('kpsy_token');
      const res = await fetch(`/api/super-admin/tenants/${manualForm.tenantId}/approve-payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          durationMonths: Number(manualForm.durationMonths),
        }),
      });

      if (res.ok) {
        alert('✅ Encaissement manuel enregistré et abonnement renouvelé avec succès !');
        setIsManualModalOpen(false);
        fetchBilling();
      } else {
        alert("⚠️ Erreur lors de l'enregistrement de l'encaissement.");
      }
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement de la comptabilité globale...</div>;
  if (error?.includes('403')) return <ForbiddenState message="Seuls les rôles SUPER_ADMIN et FINANCE ont accès à la comptabilité globale de la plateforme." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0, fontFamily: "'Sora', sans-serif" }}>💰 Comptabilité & Finance Globales</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Vue financière consolidée de la plateforme SaaS Door Waar</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleOpenManualModal}
            style={{ background: '#059669', color: 'var(--text-inverse)', border: 'none', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)' }}
          >
            ➕ Saisir un Encaissement Manuel
          </button>
          <button
            onClick={() => handleExport('invoices')}
            style={{ background: '#0F172A', color: 'var(--text-inverse)', border: 'none', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Export Factures CSV
          </button>
          <button
            onClick={() => handleExport('tenants')}
            style={{ background: themeColor, color: 'var(--text-inverse)', border: 'none', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Export Tenants CSV
          </button>
        </div>
      </div>

      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <KpiCard title="CA Facturé" value={`${data.metrics.billedTotal.toLocaleString()} XOF`} icon="📜" />
          <KpiCard title="CA Encaissé" value={`${data.metrics.collectedTotal.toLocaleString()} XOF`} icon="✅" />
          <KpiCard title="Créances / Impayés" value={`${data.metrics.receivablesTotal.toLocaleString()} XOF`} icon="⚠️" />
          <KpiCard title="MRR (Revenu Mensuel)" value={`${data.metrics.mrr.toLocaleString()} XOF`} icon="📈" />
          <KpiCard title="ARR (Revenu Annuel)" value={`${data.metrics.arr.toLocaleString()} XOF`} icon="📅" />
          <KpiCard title="Abonnements Actifs" value={data.metrics.activeSubscriptionsCount} icon="💳" />
        </div>
      )}

      {/* MODAL SAISIE ENCAISSEMENT MANUEL */}
      {isManualModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', padding: 28, borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 4px 0', fontFamily: "'Sora', sans-serif", fontWeight: 800 }}>💵 Enregistrer un Encaissement Direct</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Saisie manuelle d'un paiement liquide, chèque ou virement bancaire direct</p>

            <form onSubmit={handleManualPayment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Sélectionner l'Entreprise (Tenant)</label>
                <select
                  value={manualForm.tenantId}
                  onChange={(e) => setManualForm({ ...manualForm, tenantId: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code}) - {t.sectorType}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Mode de Règlement</label>
                  <select
                    value={manualForm.paymentMethod}
                    onChange={(e) => setManualForm({ ...manualForm, paymentMethod: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                  >
                    {activeProviders.map(p => (
                      <option key={p.provider} value={p.provider}>{p.displayName}</option>
                    ))}
                    <option disabled>──────</option>
                    <option value="CASH">💵 Espèces / Liquide</option>
                    <option value="BANK_TRANSFER">🏛️ Virement Bancaire</option>
                    <option value="CHECK">📜 Chèque</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Durée (Mois)</label>
                  <select
                    value={manualForm.durationMonths}
                    onChange={(e) => {
                      const dur = Number(e.target.value);
                      const selectedPlan = pricingOptions.find(p => p.durationMonths === dur);
                      const amt = selectedPlan ? selectedPlan.finalAmount : (dur === 12 ? 62400 : dur === 6 ? 35100 : 6500);
                      setManualForm({ ...manualForm, durationMonths: dur, amount: amt });
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                  >
                    {pricingOptions.length > 0 ? (
                      pricingOptions.map(p => (
                        <option key={p.durationMonths} value={p.durationMonths}>
                          {p.durationMonths} Mois ({p.finalAmount.toLocaleString()} XOF)
                        </option>
                      ))
                    ) : (
                      <>
                        <option value={1}>1 Mois (6 500 XOF)</option>
                        <option value={6}>6 Mois (35 100 XOF)</option>
                        <option value={12}>12 Mois (62 400 XOF)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Montant Réel Encaissé (XOF)</label>
                <input
                  type="number" required
                  value={manualForm.amount}
                  onChange={(e) => setManualForm({ ...manualForm, amount: Number(e.target.value) })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Référence de la Transaction / Reçu</label>
                <input
                  type="text" required
                  placeholder="ex: CHQ-884920 ou TXN-WAVE-992"
                  value={manualForm.transactionRef}
                  onChange={(e) => setManualForm({ ...manualForm, transactionRef: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" onClick={() => setIsManualModalOpen(false)} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', fontWeight: 700, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: '#059669', color: 'var(--text-inverse)', fontWeight: 800, cursor: 'pointer' }}>
                  Valider l'Encaissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
