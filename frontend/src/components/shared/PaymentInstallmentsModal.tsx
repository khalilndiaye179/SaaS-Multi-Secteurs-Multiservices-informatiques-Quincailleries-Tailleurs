import React, { useState, useEffect } from 'react';

interface PaymentInstallment {
  id: string;
  amount: number;
  paymentDate: string;
  method: string;
  reference?: string;
  notes?: string;
}

interface Props {
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  themeColor: string;
  onClose: () => void;
  onPaymentAdded: () => void;
}

export const PaymentInstallmentsModal: React.FC<Props> = ({
  invoiceId,
  invoiceNumber,
  totalAmount,
  paidAmount,
  themeColor,
  onClose,
  onPaymentAdded,
}) => {
  const [payments, setPayments] = useState<PaymentInstallment[]>([]);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState('CASH');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const remainingAmount = totalAmount - paidAmount;

  const token = localStorage.getItem('kpsy_token');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await fetch(`/api/business-billing/invoices/${invoiceId}/payments`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0 || amount > remainingAmount) {
      alert('Montant invalide.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/business-billing/invoices/${invoiceId}/payment`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          amount: Number(amount),
          method,
          reference,
          notes,
        }),
      });

      if (res.ok) {
        setAmount('');
        setReference('');
        setNotes('');
        await fetchPayments();
        onPaymentAdded(); // Appellera fetchData du parent pour mettre à jour la facture
      } else {
        const err = await res.json();
        alert('Erreur: ' + (err.message || 'Impossible d\'enregistrer le paiement.'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: 'var(--bg-card)',
        width: 600,
        maxWidth: '90%',
        borderRadius: 16,
        padding: 32,
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Paiements - Facture {invoiceNumber}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div style={{ flex: 1, padding: 16, background: '#F8FAFC', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Facture</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>{totalAmount.toLocaleString()} XOF</div>
          </div>
          <div style={{ flex: 1, padding: 16, background: '#ECFDF5', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#065F46', fontWeight: 600 }}>Montant Payé</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>{paidAmount.toLocaleString()} XOF</div>
          </div>
          <div style={{ flex: 1, padding: 16, background: '#FEF2F2', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#991B1B', fontWeight: 600 }}>Reste à payer</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#DC2626' }}>{remainingAmount.toLocaleString()} XOF</div>
          </div>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>Historique des Versements</h3>
        {loading ? (
          <p>Chargement...</p>
        ) : payments.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Aucun paiement enregistré pour cette facture.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginBottom: 24 }}>
            <thead>
              <tr style={{ background: '#F1F5F9', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px' }}>Date</th>
                <th style={{ padding: '8px 12px' }}>Montant</th>
                <th style={{ padding: '8px 12px' }}>Moyen</th>
                <th style={{ padding: '8px 12px' }}>Référence</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '8px 12px' }}>{new Date(p.paymentDate).toLocaleDateString('fr-FR')}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700 }}>{p.amount.toLocaleString()} XOF</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ background: '#E2E8F0', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem' }}>{p.method}</span>
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{p.reference || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {remainingAmount > 0 && (
          <>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12, marginTop: 24, paddingTop: 24, borderTop: '1px solid #E2E8F0' }}>
              Ajouter un versement
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', fontWeight: 600 }}>Montant (XOF)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    max={remainingAmount}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', fontWeight: 600 }}>Mode de paiement</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                  >
                    <option value="CASH">Espèces</option>
                    <option value="ORANGE_MONEY">Orange Money</option>
                    <option value="WAVE">Wave</option>
                    <option value="CARD">Carte Bancaire</option>
                    <option value="CHEQUE">Chèque</option>
                    <option value="TRANSFER">Virement Bancaire</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', fontWeight: 600 }}>Référence Transaction (Optionnel)</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex: ID transaction Wave ou N° chèque"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', fontWeight: 600 }}>Notes (Optionnel)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', minHeight: 60 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', fontWeight: 600, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: themeColor, color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  {submitting ? 'Enregistrement...' : 'Enregistrer le versement'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
