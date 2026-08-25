import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/api-client';

interface PricingOption {
  durationMonths: number;
  monthlyPrice: number;
  grossAmount: number;
  discountPercentage: number;
  finalAmount: number;
  savingsAmount: number;
}

interface Props {
  onSubmitted?: () => void;
  compact?: boolean;
}

export const SubscriptionRenewalPanel: React.FC<Props> = ({ onSubmitted, compact = false }) => {
  const [pricingOptions, setPricingOptions] = useState<PricingOption[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(true);

  const [activeProviders, setActiveProviders] = useState<{provider: string, displayName: string, qrCodeUrl?: string}[]>([]);
  const [provider, setProvider] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [durationMonths, setDurationMonths] = useState(1);
  const [amount, setAmount] = useState(6500);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchPricingPlans = async () => {
      setLoadingPricing(true);
      try {
        const res = await fetch('/api/business-billing/pricing-plans');
        if (res.ok) {
          const resData = await res.json();
          const plans: PricingOption[] = resData.plans || [];
          setPricingOptions(plans);
          const option1 = plans.find((opt) => opt.durationMonths === 1);
          if (option1) {
            setAmount(option1.finalAmount);
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement des tarifs officiels:', err);
      } finally {
        setLoadingPricing(false);
      }
    };

    const fetchActiveProviders = async () => {
      try {
        const providers = await ApiClient.get<{provider: string, displayName: string, qrCodeUrl?: string}[]>('/api/payment-providers/active');
        setActiveProviders(providers);
        if (providers.length > 0) {
          setProvider(providers[0].provider);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des moyens de paiement:', err);
      }
    };

    fetchPricingPlans();
    fetchActiveProviders();
  }, []);

  const handleDurationChange = (months: number) => {
    setDurationMonths(months);
    const plan = pricingOptions.find((p) => p.durationMonths === months);
    if (plan) {
      setAmount(plan.finalAmount);
    } else {
      const fallbackAmount = months === 6 ? 35100 : months === 12 ? 62400 : 6500;
      setAmount(fallbackAmount);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem('kpsy_token');
      const res = await fetch('/api/billing/pay-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider,
          transactionRef,
          amount,
          durationMonths,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || 'Erreur lors de l’envoi de la preuve.');
      }

      setSuccessMsg(
        '✅ Preuve de paiement transmise avec succès au Super Admin ! Votre abonnement sera mis à jour dès validation.',
      );
      setTransactionRef('');
      if (onSubmitted) {
        setTimeout(() => {
          onSubmitted();
        }, 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur de connexion au serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: '#1E293B', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', padding: compact ? 20 : 28, color: 'var(--text-inverse)' }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.1rem', margin: '0 0 6px 0', color: '#F3F4F6' }}>
          💳 Formules d'Abonnement & Renouvellement
        </h3>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Sélectionnez votre formule dégressive et soumettez votre reçu de paiement {activeProviders.length > 0 ? `via ${activeProviders.map(p => p.displayName).join(' ou ')}` : 'via un moyen de paiement disponible'}
        </p>
      </div>

      {errorMsg && (
        <div style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid #EF4444', borderRadius: 8, padding: 12, fontSize: '0.8rem', color: '#FCA5A5', marginBottom: 16 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {successMsg ? (
        <div style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid #10B981', borderRadius: 10, padding: 16, fontSize: '0.85rem', color: '#6EE7B7', textAlign: 'center', lineHeight: 1.5 }}>
          {successMsg}
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', marginBottom: 6 }}>
              Choix de la formule (Tarif unique UEMOA)
            </label>
            {loadingPricing ? (
              <div style={{ padding: 12, background: '#0F172A', borderRadius: 10, border: '1px solid #334155', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                ⏳ Chargement des tarifs officiels en cours...
              </div>
            ) : (
              <select
                value={durationMonths}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10, background: '#0F172A',
                  border: '1px solid #334155', color: 'var(--text-inverse)', fontSize: '0.85rem', fontWeight: 600,
                }}
              >
                {pricingOptions.length > 0 ? (
                  pricingOptions.map((opt) => (
                    <option key={opt.durationMonths} value={opt.durationMonths}>
                      {opt.durationMonths} Mois — {opt.finalAmount.toLocaleString()} XOF
                      {opt.discountPercentage > 0 ? ` (Remise -${opt.discountPercentage}% / Économie ${opt.savingsAmount.toLocaleString()} XOF 🔥)` : ' (Tarif mensuel)'}
                    </option>
                  ))
                ) : (
                  <>
                    <option value={1}>1 Mois — 6 500 XOF (Tarif de base)</option>
                    <option value={6}>6 Mois — 35 100 XOF (Remise -10%)</option>
                    <option value={12}>12 Mois — 62 400 XOF (Remise -20% 🔥)</option>
                  </>
                )}
              </select>
            )}
          </div>

          <div style={{
            background: '#0F172A', padding: 14, borderRadius: 10, border: '1px solid #334155',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Montant à transférer :</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981', fontFamily: "'Sora', sans-serif" }}>
                {amount.toLocaleString()} XOF
              </div>
            </div>
            {provider === 'WAVE' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {activeProviders.find(p => p.provider === 'WAVE')?.qrCodeUrl ? (
                  <img src={activeProviders.find(p => p.provider === 'WAVE')?.qrCodeUrl} alt="QR Code Wave" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'contain', background: '#FFF', padding: 4 }} />
                ) : (
                  <div style={{ fontSize: '0.70rem', color: '#F59E0B', textAlign: 'center', maxWidth: 100, background: '#1E293B', padding: '6px', borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.3)' }}>QR non configuré, contactez le support</div>
                )}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', marginBottom: 6 }}>
              Moyen de règlement
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, background: '#0F172A',
                border: '1px solid #334155', color: 'var(--text-inverse)', fontSize: '0.85rem',
              }}
            >
              {activeProviders.length > 0 ? (
                activeProviders.map(p => (
                  <option key={p.provider} value={p.provider}>{p.displayName}</option>
                ))
              ) : (
                <option value="">Aucun moyen de paiement disponible</option>
              )}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', marginBottom: 6 }}>
              N° de Transaction / Référence de reçu
            </label>
            <input
              type="text"
              required
              placeholder="ex: WAVE-2026-98765432"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, background: '#0F172A',
                border: '1px solid #334155', color: 'var(--text-inverse)', fontSize: '0.85rem',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 6, padding: '12px 18px', borderRadius: 10,
              background: submitting ? '#64748B' : '#059669', color: 'var(--text-inverse)', border: 'none',
              fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '0.88rem',
              cursor: submitting ? 'wait' : 'pointer', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
            }}
          >
            {submitting ? 'Transmissions...' : 'Soumettre ma preuve de paiement →'}
          </button>
        </form>
      )}
    </div>
  );
};
