import { StorageService } from '../../services/storage';
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { DocumentPrintModal } from './DocumentPrintModal';
import { PaymentInstallmentsModal } from './PaymentInstallmentsModal';


interface Props {
  sector: string;
  themeColor: string;
}

interface QuoteLine {
  id?: string;
  stockItemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Quote {
  id: string;
  number: string;
  clientName: string;
  clientPhone?: string;
  totalAmount: number;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  validUntil?: string;
  lines: QuoteLine[];
}

interface Invoice {
  id: string;
  number: string;
  quoteId?: string;
  clientName: string;
  clientPhone?: string;
  totalAmount: number;
  paidAmount?: number;
  status: 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  createdAt: string;
  lines: QuoteLine[];
}

export const BusinessBillingManager: React.FC<Props> = ({ sector, themeColor }) => {
  const [subTab, setSubTab] = useState<'quotes' | 'invoices'>('quotes');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [stockItems, setStockItems] = useState<any[]>([]);

  // Print Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printDoc, setPrintDoc] = useState<{
    type: 'DEVIS' | 'FACTURE';
    number: string;
    date: string;
    validUntil?: string;
    clientName: string;
    clientPhone?: string;
    items: Array<{ description: string; quantity: number; unitPrice: number }>;
  }>({
    type: 'DEVIS',
    number: '',
    date: '',
    clientName: '',
    items: [],
  });

  const [paymentModalData, setPaymentModalData] = useState<{
    invoiceId: string;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
  } | null>(null);

  const handleOpenPrintModal = (
    type: 'DEVIS' | 'FACTURE',
    number: string,
    createdAt: string,
    clientName: string,
    clientPhone?: string,
    lines?: QuoteLine[],
    validUntil?: string,
  ) => {
    setPrintDoc({
      type,
      number,
      date: new Date(createdAt).toLocaleDateString('fr-FR'),
      validUntil,
      clientName,
      clientPhone,
      items: lines
        ? lines.map((l) => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice }))
        : [{ description: 'Prestation / Vente', quantity: 1, unitPrice: 0 }],
    });
    setShowPrintModal(true);
  };

  const user = JSON.parse(localStorage.getItem('kpsy_user') || '{}');
  const isAdmin = !user?.roles || user?.roles?.length === 0 || user?.roles?.includes('TENANT_ADMIN') || user?.roles?.includes('ADMIN_TENANT') || user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN');

  const handleDeleteDocument = async (type: 'QUOTE' | 'INVOICE', id: string) => {
    if (!isAdmin) {
      alert('Action réservée exclusivement à l\'Administrateur du Tenant.');
      return;
    }

    if (!window.confirm(`⚠️ SUPPRESSION DÉFINITIVE : Voulez-vous vraiment SUPPRIMER ce ${type === 'QUOTE' ? 'Devis' : 'Facture'} ?`)) return;

    try {
      const endpoint = type === 'QUOTE' ? `/api/business-billing/quotes/${id}/delete` : `/api/business-billing/invoices/${id}/delete`;
      const res = await fetch(endpoint, { method: 'POST', headers });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePayInvoice = async (id: string) => {
    if (!window.confirm('Voulez-vous marquer cette facture comme TOTALEMENT PAYÉE ? Cette action mettra à jour les stocks (si applicable).')) return;
    try {
      const invoice = invoices.find(i => i.id === id);
      const remainingAmount = invoice ? invoice.totalAmount - (invoice.paidAmount || 0) : 0;
      
      const res = await fetch(`/api/business-billing/invoices/${id}/payment`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ amount: remainingAmount })
      });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert('Erreur: ' + (err.message || 'Impossible de marquer comme payée.'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePartialPayment = async (id: string, number: string, currentPaid: number, total: number) => {
    setPaymentModalData({
      invoiceId: id,
      invoiceNumber: number,
      totalAmount: total,
      paidAmount: currentPaid,
    });
  };

  const handleCancelDocument = (type: 'QUOTE' | 'INVOICE', id: string) => {
    if (!isAdmin) {
      alert('Action réservée à l\'Administrateur de l\'établissement.');
      return;
    }

    if (!window.confirm(`Voulez-vous vraiment annuler ce ${type === 'QUOTE' ? 'Devis' : 'Facture'} ?`)) return;

    if (type === 'QUOTE') {
      setQuotes(quotes.map((q) => (q.id === id ? { ...q, status: 'REJECTED' } : q)));
    } else {
      setInvoices(invoices.map((inv) => (inv.id === id ? { ...inv, status: 'CANCELLED' } : inv)));
    }
  };




  // Formulaire Devis / Facture
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [lines, setLines] = useState<Array<{ description: string; quantity: number; unitPrice: number }>>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [applyVat, setApplyVat] = useState(false);
  const [validityDuration, setValidityDuration] = useState('30');

  let token;
    StorageService.get("kpsy_token").then(t => token = t);
    // FIXME: token fetch is now async, might break sync logic
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resQ, resI] = await Promise.all([
        fetch('/api/business-billing/quotes', { headers }),
        fetch('/api/business-billing/invoices', { headers }),
      ]);

      if (resQ.ok) setQuotes(await resQ.json());
      if (resI.ok) setInvoices(await resI.json());

      if (sector === 'QUINCAILLERIE') {
        const resStock = await fetch('/api/quincaillerie/stock', { headers });
        if (resStock.ok) {
          setStockItems(await resStock.json());
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddLine = () => {
    setLines([...lines, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const newLines = [...lines];
    if (field === 'stockItemId') {
      const selectedItem = stockItems.find((item) => item.id === value);
      if (selectedItem) {
        (newLines[index] as any)['stockItemId'] = selectedItem.id;
        (newLines[index] as any)['description'] = selectedItem.name;
        (newLines[index] as any)['unitPrice'] = selectedItem.sellingPrice;
      } else {
        (newLines[index] as any)['stockItemId'] = '';
        (newLines[index] as any)['description'] = '';
        (newLines[index] as any)['unitPrice'] = 0;
      }
    } else {
      (newLines[index] as any)[field] = value;
    }
    setLines(newLines);
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const endpoint = subTab === 'quotes' ? '/api/business-billing/quotes' : '/api/business-billing/invoices';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          clientName,
          clientPhone,
          applyVat,
          lines,
          ...(subTab === 'quotes' && { validityDuration: parseInt(validityDuration, 10) || undefined }),
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setClientName('');
        setClientPhone('');
        setApplyVat(false);
        setValidityDuration('30');
        setLines([{ description: '', quantity: 1, unitPrice: 0 }]);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvertQuote = async (quoteId: string) => {
    try {
      const res = await fetch(`/api/business-billing/quotes/${quoteId}/convert`, {
        method: 'POST',
        headers,
      });

      if (res.ok) {
        fetchData();
        setSubTab('invoices');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPdf = async (type: 'QUOTE' | 'INVOICE', id: string, number: string) => {
    const endpoint = type === 'QUOTE'
      ? `/api/business-billing/quotes/${id}/pdf`
      : `/api/business-billing/invoices/${id}/pdf`;
    const res = await fetch(endpoint, { headers });
    if (!res.ok) {
      alert('Erreur lors de la génération du PDF.');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type === 'QUOTE' ? 'devis' : 'facture'}-${number}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const calculateTotal = () => {
    const ht = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
    return applyVat ? Math.round(ht * 1.18) : ht;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Sub Topbar & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, background: '#E2E8F0', padding: 4, borderRadius: 10 }}>
          <button
            onClick={() => setSubTab('quotes')}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: subTab === 'quotes' ? themeColor : 'transparent',
              color: subTab === 'quotes' ? 'white' : '#475569',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            📋 Devis ({quotes.length})
          </button>
          <button
            onClick={() => setSubTab('invoices')}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: subTab === 'invoices' ? themeColor : 'transparent',
              color: subTab === 'invoices' ? 'white' : '#475569',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            🧾 Factures ({invoices.length})
          </button>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: themeColor,
            color: 'var(--text-inverse)',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: `0 4px 12px ${themeColor}30`,
          }}
        >
          + Créer un {subTab === 'quotes' ? 'Devis' : 'Facture'}
        </button>
      </div>

      {/* Table Content */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des documents...</div>
        ) : subTab === 'quotes' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>N° Devis</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Client</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Montant Total</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Statut</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Aucun devis enregistré pour le moment.
                  </td>
                </tr>
              ) : (
                quotes.map((q) => (
                  <tr key={q.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: themeColor }}>{q.number}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600 }}>{q.clientName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{q.clientPhone || '—'}</div>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 800, color: '#0F172A' }}>
                      {q.totalAmount.toLocaleString()} XOF
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          background: q.status === 'ACCEPTED' ? '#D1FAE5' : '#FEF3C7',
                          color: q.status === 'ACCEPTED' ? '#065F46' : '#92400E',
                        }}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleOpenPrintModal('DEVIS', q.number, q.createdAt, q.clientName, q.clientPhone, q.lines, q.validUntil)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 6,
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-main)',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          👁️ Visionner / 🖨️ PDF
                        </button>
                        <button
                          onClick={() => handleDownloadPdf('QUOTE', q.id, q.number)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 6,
                            border: 'none',
                            background: '#3B82F6',
                            color: 'var(--text-inverse)',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          📥 Télécharger PDF
                        </button>
                        {q.status !== 'ACCEPTED' && q.status !== 'REJECTED' && (
                          <>
                            <button
                              onClick={() => handleConvertQuote(q.id)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: 6,
                                border: 'none',
                                background: '#059669',
                                color: 'var(--text-inverse)',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                              }}
                            >
                              Convertir en Facture ✓
                            </button>
                            <button
                              onClick={() => handleCancelDocument('QUOTE', q.id)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: 6,
                                border: 'none',
                                background: '#FEF3C7',
                                color: '#92400E',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                              }}
                            >
                              🚫 Annuler
                            </button>
                          </>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteDocument('QUOTE', q.id)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              border: 'none',
                              background: '#FEE2E2',
                              color: '#DC2626',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                            title="Suppression réservée à l'Administrateur"
                          >
                            🗑️ Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>N° Facture</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Client</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Montant Total</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Statut</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Aucune facture enregistrée pour le moment.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: themeColor }}>{inv.number}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600 }}>{inv.clientName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.clientPhone || '—'}</div>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 800, color: '#0F172A' }}>
                      {inv.totalAmount.toLocaleString()} XOF
                      {inv.paidAmount && inv.paidAmount > 0 && inv.status !== 'PAID' ? (
                        <div style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600, marginTop: 4 }}>
                          Reste: {(inv.totalAmount - inv.paidAmount).toLocaleString()} XOF
                        </div>
                      ) : null}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.75rem', background: inv.status === 'PAID' ? '#D1FAE5' : inv.status === 'PARTIALLY_PAID' ? '#DBEAFE' : inv.status === 'CANCELLED' ? '#FEE2E2' : '#FEF3C7', color: inv.status === 'PAID' ? '#065F46' : inv.status === 'PARTIALLY_PAID' ? '#1D4ED8' : inv.status === 'CANCELLED' ? '#DC2626' : '#92400E' }}>
                        {inv.status === 'PARTIALLY_PAID' ? 'PAIEMENT PARTIEL' : inv.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleOpenPrintModal('FACTURE', inv.number, inv.createdAt, inv.clientName, inv.clientPhone, inv.lines)}
                          style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          👁️ Visionner / 🖨️ PDF
                        </button>
                        <button
                          onClick={() => handleDownloadPdf('INVOICE', inv.id, inv.number)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 6,
                            border: 'none',
                            background: '#3B82F6',
                            color: 'var(--text-inverse)',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          📥 Télécharger PDF
                        </button>
                        {inv.status !== 'CANCELLED' && inv.status !== 'PAID' && (
                          <>
                            <button
                              onClick={() => handlePartialPayment(inv.id, inv.number, inv.paidAmount || 0, inv.totalAmount)}
                              style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#3B82F6', color: 'var(--text-inverse)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              💵 Pmt Partiel
                            </button>
                            <button
                              onClick={() => handlePayInvoice(inv.id)}
                              style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#059669', color: 'var(--text-inverse)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              ✅ Totalement Payée
                            </button>
                            <button
                              onClick={() => handleCancelDocument('INVOICE', inv.id)}
                              style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              🚫 Annuler
                            </button>
                          </>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteDocument('INVOICE', inv.id)}
                            style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#FEE2E2', color: '#DC2626', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                            title="Suppression réservée à l'Administrateur"
                          >
                            🗑️ Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                ))
              )}
            </tbody>
          </table>
        )}
      </div>


      {/* Modal Création Document */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Créer un ${subTab === 'quotes' ? 'Devis' : 'Facture'}`}
      >
        <form onSubmit={handleCreateDocument} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
              Nom du Client
            </label>
            <input
              required
              placeholder="ex: Ousmane SOW"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
              Téléphone Client
            </label>
            <input
              placeholder="ex: +221 77 123 45 67"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
            />
          </div>

          {subTab === 'quotes' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                Durée de validité (en jours)
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="ex: 30"
                value={validityDuration}
                onChange={(e) => setValidityDuration(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
              />
            </div>
          )}

          <div style={{ marginTop: 10 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
              Lignes de Prestations / Articles
            </label>

            {lines.map((line, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                {sector === 'QUINCAILLERIE' ? (
                  <select
                    required
                    value={(line as any).stockItemId || ''}
                    onChange={(e) => handleLineChange(idx, 'stockItemId', e.target.value)}
                    style={{ flex: 2, padding: '8px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: '0.82rem', background: 'var(--bg-card)' }}
                  >
                    <option value="" disabled>Sélectionner un article...</option>
                    {stockItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.quantity} en stock) - {item.sellingPrice} XOF
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    required
                    placeholder="Description..."
                    value={line.description}
                    onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                    style={{ flex: 2, padding: '8px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: '0.82rem' }}
                  />
                )}
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Qté"
                  value={line.quantity}
                  onChange={(e) => handleLineChange(idx, 'quantity', Number(e.target.value))}
                  style={{ width: 60, padding: '8px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: '0.82rem' }}
                />
                <input
                  type="number"
                  required
                  placeholder="Prix (XOF)"
                  value={line.unitPrice}
                  onChange={(e) => handleLineChange(idx, 'unitPrice', Number(e.target.value))}
                  style={{ width: 100, padding: '8px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: '0.82rem' }}
                />
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(idx)}
                    style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, padding: '8px 10px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddLine}
              style={{
                marginTop: 6,
                background: 'var(--bg-main)',
                color: 'var(--text-muted)',
                border: '1px dashed #94A3B8',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              + Ajouter une ligne
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <input
              type="checkbox"
              id="applyVat"
              checked={applyVat}
              onChange={(e) => setApplyVat(e.target.checked)}
            />
            <label htmlFor="applyVat" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer' }}>
              Appliquer la TVA (18%)
            </label>
          </div>

          <div style={{ textAlign: 'right', marginTop: 10, fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
            Total Estimé : {calculateTotal().toLocaleString()} XOF
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: themeColor, color: 'var(--text-inverse)', fontWeight: 700, cursor: 'pointer' }}
            >
              {submitting ? 'Enregistrement...' : 'Valider'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal d'Impression Officielle PDF */}
      <DocumentPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title={`Impression Document Officiel : ${printDoc.number}`}
        documentType={printDoc.type}
        documentNumber={printDoc.number}
        dateStr={printDoc.date}
        validUntil={printDoc.validUntil}
        clientName={printDoc.clientName}
        clientPhone={printDoc.clientPhone}
        items={printDoc.items}
        themeColor={themeColor}
      />

      {/* MODAL GESTION ACOMPTES/VERSEMENTS */}
      {paymentModalData && (
        <PaymentInstallmentsModal
          invoiceId={paymentModalData.invoiceId}
          invoiceNumber={paymentModalData.invoiceNumber}
          totalAmount={paymentModalData.totalAmount}
          paidAmount={paymentModalData.paidAmount}
          themeColor={themeColor}
          onClose={() => setPaymentModalData(null)}
          onPaymentAdded={() => {
            fetchData();
            // On ferme la modale car le state de 'paidAmount' serait désync dans le composant
            setPaymentModalData(null);
          }}
        />
      )}
    </div>
  );
};
