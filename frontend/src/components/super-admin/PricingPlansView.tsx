import React, { useState, useEffect, useRef } from 'react';

interface PricingPlanOption {
  durationMonths: number;
  monthlyPrice: number;
  grossAmount: number;
  discountPercentage: number;
  finalAmount: number;
  savingsAmount: number;
  currency: string;
}

interface Props {
  themeColor?: string;
}

export const PricingPlansView: React.FC<Props> = ({ themeColor = '#312E81' }) => {
  const [plans, setPlans] = useState<PricingPlanOption[]>([]);
  const [basePrice, setBasePrice] = useState<number>(6500);
  const [discount6, setDiscount6] = useState<number>(10);
  const [discount12, setDiscount12] = useState<number>(20);
  const [currency, setCurrency] = useState<string>('XOF');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      formRef.current.style.transition = 'all 0.3s ease-in-out';
      formRef.current.style.boxShadow = `0 0 0 4px ${themeColor}80`;
      formRef.current.style.borderColor = themeColor;
      
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
          formRef.current.style.borderColor = '#E2E8F0';
        }
      }, 1500);
    }
  };

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/business-billing/pricing-plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
        if (data.monthlyPrice) setBasePrice(data.monthlyPrice);
        if (data.currency) setCurrency(data.currency);
        if (data.plans && data.plans.length >= 3) {
          setDiscount6(data.plans[1].discountPercentage || 10);
          setDiscount12(data.plans[2].discountPercentage || 20);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('kpsy_token');
      const res = await fetch('/api/super-admin/pricing-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          baseMonthlyPrice: Number(basePrice),
          discount6Months: discount6 / 100,
          discount12Months: discount12 / 100,
          currency,
        }),
      });

      if (res.ok) {
        alert('✅ Grille tarifaire officielle mise à jour avec succès !');
        fetchPricing();
      } else {
        const err = await res.json();
        alert(`⚠️ Erreur : ${err.message || 'Impossible de mettre à jour la tarification.'}`);
      }
    } catch (e: any) {
      alert(`Erreur : ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement de la grille tarifaire...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* En-tête */}
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0, fontFamily: "'Sora', sans-serif" }}>
          🏷️ Grille Tarifaire & Plans d'Abonnement SaaS UEMOA
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Gestion des prix de base mensuels (XOF) et réductions dégressives sur les abonnements
        </p>
      </div>

      {/* Cartes de simulation des plans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* Plan 1 mois */}
        <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', background: 'var(--bg-main)', color: 'var(--text-muted)', borderRadius: 20 }}>
              MENSUEL (1 MOIS)
            </span>
            <span style={{ fontSize: '1.4rem' }}>💳</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', fontFamily: "'Sora', sans-serif" }}>
            {basePrice.toLocaleString()} {currency}
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>/mois</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Paiement sans engagement renouvelable chaque mois.</p>
          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '16px 0' }} />
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
            <div>Total facturé : <strong>{basePrice.toLocaleString()} {currency}</strong></div>
            <div style={{ color: '#059669', marginTop: 4 }}>Sans engagement</div>
          </div>
          <button 
            onClick={scrollToForm}
            style={{ width: '100%', padding: '10px', marginTop: 16, background: 'var(--bg-main)', color: '#0F172A', border: '1px solid var(--border-color)', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: 6, alignItems: 'center', transition: 'all 0.2s' }}>
            <span>✏️</span> Modifier ce tarif
          </button>
        </div>

        {/* Plan 6 mois */}
        <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 16, border: `2px solid ${themeColor}`, boxShadow: `0 4px 20px ${themeColor}18`, position: 'relative' }}>
          <div style={{ position: 'absolute', top: -12, right: 20, background: themeColor, color: 'var(--text-inverse)', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 12 }}>
            RECOMMANDÉ (-{discount6}%)
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', background: '#EEF2FF', color: themeColor, borderRadius: 20 }}>
              SEMESTRIEL (6 MOIS)
            </span>
            <span style={{ fontSize: '1.4rem' }}>⭐</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: themeColor, fontFamily: "'Sora', sans-serif" }}>
            {Math.round(basePrice * (1 - discount6 / 100)).toLocaleString()} {currency}
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>/mois</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Facturé semestriellement avec une économie immédiate.</p>
          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '16px 0' }} />
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
            <div>Total facturé : <strong>{Math.round(basePrice * 6 * (1 - discount6 / 100)).toLocaleString()} {currency}</strong></div>
            <div style={{ color: '#059669', marginTop: 4 }}>
              Économie : {Math.round(basePrice * 6 * (discount6 / 100)).toLocaleString()} {currency}
            </div>
          </div>
          <button 
            onClick={scrollToForm}
            style={{ width: '100%', padding: '10px', marginTop: 16, background: 'var(--bg-main)', color: '#0F172A', border: '1px solid var(--border-color)', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: 6, alignItems: 'center', transition: 'all 0.2s' }}>
            <span>✏️</span> Modifier ce tarif
          </button>
        </div>

        {/* Plan 12 mois */}
        <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', background: '#ECFDF5', color: '#047857', borderRadius: 20 }}>
              ANNUEL (12 MOIS)
            </span>
            <span style={{ fontSize: '1.4rem' }}>👑</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#047857', fontFamily: "'Sora', sans-serif" }}>
            {Math.round(basePrice * (1 - discount12 / 100)).toLocaleString()} {currency}
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>/mois</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Rentrabilité maximale avec réduction VIP de {discount12}%.</p>
          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '16px 0' }} />
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
            <div>Total facturé : <strong>{Math.round(basePrice * 12 * (1 - discount12 / 100)).toLocaleString()} {currency}</strong></div>
            <div style={{ color: '#059669', marginTop: 4 }}>
              Économie : {Math.round(basePrice * 12 * (discount12 / 100)).toLocaleString()} {currency}
            </div>
          </div>
          <button 
            onClick={scrollToForm}
            style={{ width: '100%', padding: '10px', marginTop: 16, background: 'var(--bg-main)', color: '#0F172A', border: '1px solid var(--border-color)', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: 6, alignItems: 'center', transition: 'all 0.2s' }}>
            <span>✏️</span> Modifier ce tarif
          </button>
        </div>
      </div>

      {/* Formulaire de configuration des prix */}
      <div ref={formRef} style={{ background: 'var(--bg-card)', padding: 28, borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700, color: '#0F172A', fontFamily: "'Sora', sans-serif" }}>
          ⚙️ Ajuster la Tarification Officielle du SaaS
        </h3>

        <form onSubmit={handleSaveConfig} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
              Tarif Mensuel de Base (XOF)
            </label>
            <input
              type="number"
              required
              min={1000}
              step={500}
              value={basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value))}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14, fontWeight: 700 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
              Réduction 6 Mois Semestriel (%)
            </label>
            <input
              type="number"
              required
              min={0}
              max={50}
              value={discount6}
              onChange={(e) => setDiscount6(Number(e.target.value))}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14, fontWeight: 700 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
              Réduction 12 Mois Annuel (%)
            </label>
            <input
              type="number"
              required
              min={0}
              max={60}
              value={discount12}
              onChange={(e) => setDiscount12(Number(e.target.value))}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14, fontWeight: 700 }}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%',
                padding: '11px 20px',
                borderRadius: 8,
                border: 'none',
                background: themeColor,
                color: 'var(--text-inverse)',
                fontSize: 14,
                fontWeight: 800,
                cursor: saving ? 'wait' : 'pointer',
                boxShadow: `0 4px 14px ${themeColor}40`,
              }}
            >
              {saving ? 'Enregistrement...' : '💾 Mettre à jour la Tarification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
