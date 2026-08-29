import { StorageService } from '../../services/storage';
import React, { useState, useEffect } from 'react';
import { SubscriptionRenewalPanel } from './SubscriptionRenewalPanel';

interface Props {
  themeColor: string;
}

interface TenantBillingStatus {
  id: string;
  code: string;
  name: string;
  billingStatus: 'TRIAL_7D' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'ARCHIVED';
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
}

interface PaymentProof {
  id: string;
  provider: string;
  transactionRef: string;
  amount: number;
  durationMonths: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  processedAt?: string;
}

export const TenantSubscriptionManager: React.FC<Props> = ({ themeColor }) => {
  const [billingInfo, setBillingInfo] = useState<TenantBillingStatus | null>(null);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRenewalModal, setShowRenewalModal] = useState(false);

  let token;
    StorageService.get("kpsy_token").then(t => token = t);
    // FIXME: token fetch is now async, might break sync logic
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statusRes, proofsRes] = await Promise.all([
        fetch('/api/billing/status', { headers }),
        fetch('/api/billing/my-payment-proofs', { headers }),
      ]);

      if (statusRes.ok) setBillingInfo(await statusRes.json());
      if (proofsRes.ok) setProofs(await proofsRes.json());
    } catch (e) {
      console.error('Erreur chargement abonnement:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getDaysRemainingTrial = (trialEndsAt?: string) => {
    if (!trialEndsAt) return 0;
    const diff = new Date(trialEndsAt).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  const renderStatusCard = () => {
    if (!billingInfo) return null;
    const { billingStatus, trialEndsAt, subscriptionEndsAt } = billingInfo;

    let badgeBg = '#D1FAE5';
    let badgeColor = '#065F46';
    let label = 'Actif';
    let detailText = '';

    if (billingStatus === 'TRIAL_7D') {
      badgeBg = '#FEF3C7';
      badgeColor = '#92400E';
      label = 'Essai Gratuit (7 Jours)';
      const daysLeft = getDaysRemainingTrial(trialEndsAt);
      detailText = `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''} avant expiration de l'essai.`;
    } else if (billingStatus === 'ACTIVE') {
      badgeBg = '#D1FAE5';
      badgeColor = '#065F46';
      label = 'Abonnement Actif';
      detailText = subscriptionEndsAt
        ? `Valide jusqu'au ${new Date(subscriptionEndsAt).toLocaleDateString('fr-FR')}`
        : 'Abonnement actif — Date d\'échéance non configurée (Veuillez contacter le support pour régulariser votre fiche).';
    } else if (billingStatus === 'EXPIRED') {
      badgeBg = '#FEE2E2';
      badgeColor = '#DC2626';
      label = 'Abonnement Expiré';
      detailText = 'Accès actuellement restreint. Soumettez un paiement pour déverrouiller votre espace.';
    } else if (billingStatus === 'SUSPENDED') {
      badgeBg = '#F3F4F6';
      badgeColor = '#4B5563';
      label = 'Compte Suspendu';
      detailText = 'Suspendu par l\'administration. Veuillez contacter l\'assistance support.';
    }

    return (
      <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              STATUT DE L'ABONNEMENT ENTREPRISE
            </div>
            <h2 style={{ margin: '6px 0 2px 0', fontFamily: "'Sora', sans-serif", fontWeight: 800, color: 'var(--text-main)', fontSize: '1.4rem' }}>
              {billingInfo.name} <span style={{ fontSize: '0.9rem', color: themeColor, fontWeight: 700 }}>({billingInfo.code})</span>
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{detailText}</p>
          </div>

          <span style={{ padding: '6px 14px', borderRadius: 20, fontWeight: 800, fontSize: '0.82rem', background: badgeBg, color: badgeColor }}>
            {label}
          </span>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Tarif unique officiel : <strong style={{ color: 'var(--text-main)' }}>6 500 XOF / mois</strong> (Remises sur 6 & 12 mois)
          </div>

          <button
            onClick={() => setShowRenewalModal(true)}
            style={{
              padding: '10px 20px', borderRadius: 10, background: themeColor, color: 'var(--text-inverse)',
              border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <span>💳</span> Renouveler / Prolonger mon abonnement
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.3rem', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>💳</span> Gestion de Mon Abonnement & Historique de Paiement
        </h2>
        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Suivi de votre formule SaaS, renouvellement anticipé et reçu de paiement
        </p>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des données d'abonnement...</div>
      ) : (
        <>
          {renderStatusCard()}

          {/* Section Historique des Preuves de Paiement */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-main)' }}>
              <h3 style={{ margin: 0, fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📋</span> Historique de mes Preuves de Paiement Soumises ({proofs.length})
              </h3>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                <tr>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Date Soumission</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Mode Règlement</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Réf. Transaction</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Montant (XOF)</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Durée</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Statut Validation</th>
                </tr>
              </thead>
              <tbody>
                {proofs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
                      Aucune preuve de paiement soumise pour le moment.
                    </td>
                  </tr>
                ) : (
                  proofs.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                        {new Date(p.submittedAt).toLocaleString('fr-FR')}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>{p.provider}</td>
                      <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {p.transactionRef}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 800, color: '#059669' }}>
                        {p.amount.toLocaleString()} XOF
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>{p.durationMonths} mois</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '4px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.75rem',
                            background: p.status === 'APPROVED' ? '#D1FAE5' : p.status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7',
                            color: p.status === 'APPROVED' ? '#065F46' : p.status === 'REJECTED' ? '#DC2626' : '#92400E',
                          }}
                        >
                          {p.status === 'APPROVED' ? 'Validé ✓' : p.status === 'REJECTED' ? 'Rejeté ✕' : 'En attente ⏳'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal de Renouvellement / Prolongation */}
      {showRenewalModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
        }}>
          <div style={{ width: '100%', maxWidth: 540, position: 'relative' }}>
            <button
              onClick={() => setShowRenewalModal(false)}
              style={{
                position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.1)',
                border: 'none', color: 'var(--text-inverse)', borderRadius: '50%', width: 32, height: 32,
                cursor: 'pointer', fontWeight: 800, zIndex: 10,
              }}
            >
              ✕
            </button>
            <SubscriptionRenewalPanel
              onSubmitted={() => {
                setShowRenewalModal(false);
                fetchData();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
