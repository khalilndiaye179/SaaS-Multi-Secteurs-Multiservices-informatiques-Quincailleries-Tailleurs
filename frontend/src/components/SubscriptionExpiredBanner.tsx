import React, { useState } from 'react';

interface Props {
  tenantName: string;
  tenantCode: string;
  onSubmitted: () => void;
  onLogout: () => void;
}

export const SubscriptionExpiredBanner: React.FC<Props> = ({
  tenantName,
  tenantCode,
  onSubmitted,
  onLogout,
}) => {
  const [provider, setProvider] = useState('WAVE');
  const [transactionRef, setTransactionRef] = useState('');
  const [amount, setAmount] = useState(15000);
  const [durationMonths, setDurationMonths] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const token = localStorage.getItem('kpsy_token');

    try {
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
        '✅ Votre preuve de paiement a été transmise au Super Admin. Votre accès sera réactivé dès validation.',
      );
      setTimeout(() => {
        onSubmitted();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur de connexion au serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: '#1E293B',
          borderRadius: 20,
          border: '1px solid rgba(239, 68, 68, 0.3)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          maxWidth: 520,
          width: '100%',
          padding: '36px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #EF4444',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              margin: '0 auto 16px auto',
            }}
          >
            🔒
          </div>
          <h2
            style={{
              fontFamily: "'Sora', sans-serif",
              fontWeight: 800,
              fontSize: '1.4rem',
              marginBottom: 8,
              color: '#F87171',
            }}
          >
            Abonnement Expiré ou Suspendu
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
            L’accès à l'espace métier <strong>{tenantName}</strong> ({tenantCode}) est actuellement verrouillé.
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              background: 'rgba(239,68,68,0.2)',
              border: '1px solid #EF4444',
              borderRadius: 10,
              padding: '12px',
              fontSize: '0.8rem',
              color: '#FCA5A5',
              marginBottom: 20,
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg ? (
          <div
            style={{
              background: 'rgba(16,185,129,0.2)',
              border: '1px solid #10B981',
              borderRadius: 10,
              padding: '16px',
              fontSize: '0.85rem',
              color: '#6EE7B7',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            {successMsg}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', marginBottom: 6 }}>
                Formule choisie
              </label>
              <select
                value={durationMonths}
                onChange={(e) => {
                  const months = Number(e.target.value);
                  setDurationMonths(months);
                  setAmount(months === 1 ? 15000 : months === 6 ? 80000 : 150000);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: '#0F172A',
                  border: '1px solid #334155',
                  color: 'white',
                  fontSize: '0.85rem',
                }}
              >
                <option value={1}>1 Mois — 15 000 FCFA</option>
                <option value={6}>6 Mois — 80 000 FCFA (Economie 10 000 FCFA)</option>
                <option value={12}>1 An — 150 000 FCFA (2 mois offerts !)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', marginBottom: 6 }}>
                Mode de règlement
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: '#0F172A',
                  border: '1px solid #334155',
                  color: 'white',
                  fontSize: '0.85rem',
                }}
              >
                <option value="WAVE">Wave SN / CI / ML</option>
                <option value="ORANGE_MONEY">Orange Money UEMOA</option>
                <option value="BANK_TRANSFER">Virement Bancaire</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', marginBottom: 6 }}>
                Référence ou N° de Transaction
              </label>
              <input
                type="text"
                required
                placeholder="ex: WAVE-2026-98765432"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: '#0F172A',
                  border: '1px solid #334155',
                  color: 'white',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: 10,
                padding: '14px',
                borderRadius: 10,
                background: submitting ? '#64748B' : '#2563EB',
                color: 'white',
                border: 'none',
                fontFamily: "'Sora', sans-serif",
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: submitting ? 'wait' : 'pointer',
              }}
            >
              {submitting ? 'Transmissions...' : 'Soumettre ma preuve de paiement →'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            onClick={onLogout}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              fontSize: '0.8rem',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};
