import React, { useState, useEffect } from 'react';

interface PaymentProof {
  id: string;
  tenantId: string;
  tenant: {
    name: string;
    code: string;
    sectorType: string;
  };
  provider: string;
  transactionRef: string;
  amount: number;
  durationMonths: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
}

interface Props {
  themeColor: string;
}

export const PaymentProofsQueue: React.FC<Props> = ({ themeColor }) => {
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const token = localStorage.getItem('kpsy_token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchProofs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super-admin/payment-proofs', { headers });
      if (res.ok) setProofs(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProofs();
  }, []);

  const handleApprove = async (proof: PaymentProof) => {
    setProcessingId(proof.id);
    try {
      const res = await fetch(`/api/super-admin/tenants/${proof.tenantId}/approve-payment`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          durationMonths: proof.durationMonths || 1,
          proofId: proof.id,
        }),
      });

      if (res.ok) {
        fetchProofs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (proofId: string) => {
    setProcessingId(proofId);
    try {
      const res = await fetch(`/api/super-admin/payment-proofs/${proofId}/reject`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ reason: 'Référence introuvable ou invalide' }),
      });

      if (res.ok) {
        fetchProofs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: 'var(--text-main)' }}>
          File d'Attente des Preuves de Paiement UEMOA
        </h2>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Validation manuelle des reçus de paiement et renouvellement automatique des abonnements
        </p>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des preuves...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Date Soumission</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Entreprise (Tenant)</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Moyen de Paiement</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Réf. Transaction</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Montant (XOF)</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Durée (Mois)</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Statut</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {proofs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Aucune preuve de paiement dans la file pour le moment.
                  </td>
                </tr>
              ) : (
                proofs.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                      {new Date(p.submittedAt).toLocaleString('fr-FR')}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700 }}>{p.tenant?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: themeColor }}>{p.tenant?.code}</div>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 700 }}>{p.provider}</td>
                    <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-muted)' }}>
                      {p.transactionRef}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 800, color: '#059669' }}>
                        {p.amount.toLocaleString()} XOF
                      </div>
                      {(p as any).expectedAmount && (
                        <div style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: (p as any).expectedAmount === p.amount ? '#059669' : '#DC2626',
                        }}>
                          {(p as any).expectedAmount === p.amount ? '✓ Montant Conforme' : `⚠️ Attendu: ${(p as any).expectedAmount.toLocaleString()} XOF`}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 700 }}>{p.durationMonths} mois</td>

                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          background: p.status === 'APPROVED' ? '#D1FAE5' : p.status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7',
                          color: p.status === 'APPROVED' ? '#065F46' : p.status === 'REJECTED' ? '#DC2626' : '#92400E',
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {p.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            disabled={processingId === p.id}
                            onClick={() => handleApprove(p)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 6,
                              background: '#059669',
                              color: 'var(--text-inverse)',
                              border: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {processingId === p.id ? '...' : 'Valider ✓'}
                          </button>
                          <button
                            disabled={processingId === p.id}
                            onClick={() => handleReject(p.id)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 6,
                              background: '#DC2626',
                              color: 'var(--text-inverse)',
                              border: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Rejeter ✕
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Traitée</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
