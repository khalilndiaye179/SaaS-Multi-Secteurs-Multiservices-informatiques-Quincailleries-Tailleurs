import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { DocumentPrintModal } from './DocumentPrintModal';


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
  lines: QuoteLine[];
}

interface Invoice {
  id: string;
  number: string;
  quoteId?: string;
  clientName: string;
  clientPhone?: string;
  totalAmount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED';
  createdAt: string;
  lines: QuoteLine[];
}

export const BusinessBillingManager: React.FC<Props> = ({ sector, themeColor }) => {
  const [subTab, setSubTab] = useState<'quotes' | 'invoices'>('quotes');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Print Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printDoc, setPrintDoc] = useState<{
    type: 'DEVIS' | 'FACTURE';
    number: string;
    date: string;
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

  const handleOpenPrintModal = (
    type: 'DEVIS' | 'FACTURE',
    number: string,
    createdAt: string,
    clientName: string,
    clientPhone?: string,
    lines?: QuoteLine[],
  ) => {
    setPrintDoc({
      type,
      number,
      date: new Date(createdAt).toLocaleDateString('fr-FR'),
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
    { description: sector === 'TAILLEUR' ? 'Grand Boubou 3 Pièces Bazin' : 'Prestation / Article', quantity: 1, unitPrice: 15000 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem('kpsy_token');
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
    (newLines[index] as any)[field] = value;
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
          lines,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setClientName('');
        setClientPhone('');
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

  const calculateTotal = () => {
    return lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
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
            color: 'white',
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
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Chargement des documents...</div>
        ) : subTab === 'quotes' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
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
                  <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
                    Aucun devis enregistré pour le moment.
                  </td>
                </tr>
              ) : (
                quotes.map((q) => (
                  <tr key={q.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: themeColor }}>{q.number}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600 }}>{q.clientName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{q.clientPhone || '—'}</div>
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
                          onClick={() => handleOpenPrintModal('DEVIS', q.number, q.createdAt, q.clientName, q.clientPhone, q.lines)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 6,
                            border: '1px solid #CBD5E1',
                            background: 'white',
                            color: '#1E293B',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          👁️ Visionner / 🖨️ PDF
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
                                color: 'white',
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
            <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
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
                  <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
                    Aucune facture enregistrée pour le moment.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: themeColor }}>{inv.number}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600 }}>{inv.clientName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{inv.clientPhone || '—'}</div>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 800, color: '#0F172A' }}>
                      {inv.totalAmount.toLocaleString()} XOF
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.75rem', background: inv.status === 'PAID' ? '#D1FAE5' : inv.status === 'CANCELLED' ? '#FEE2E2' : '#FEF3C7', color: inv.status === 'PAID' ? '#065F46' : inv.status === 'CANCELLED' ? '#DC2626' : '#92400E' }}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleOpenPrintModal('FACTURE', inv.number, inv.createdAt, inv.clientName, inv.clientPhone, inv.lines)}
                          style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: 'white', color: '#1E293B', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          👁️ Visionner / 🖨️ PDF
                        </button>
                        {inv.status !== 'CANCELLED' && inv.status !== 'PAID' && (
                          <button
                            onClick={() => handleCancelDocument('INVOICE', inv.id)}
                            style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                          >
                            🚫 Annuler
                          </button>
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
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
              Nom du Client
            </label>
            <input
              required
              placeholder="ex: Ousmane SOW"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
              Téléphone Client
            </label>
            <input
              placeholder="ex: +221 77 123 45 67"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
              Lignes de Prestations / Articles
            </label>

            {lines.map((line, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input
                  required
                  placeholder="Description..."
                  value={line.description}
                  onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                  style={{ flex: 2, padding: '8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                />
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Qté"
                  value={line.quantity}
                  onChange={(e) => handleLineChange(idx, 'quantity', Number(e.target.value))}
                  style={{ width: 60, padding: '8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                />
                <input
                  type="number"
                  required
                  placeholder="Prix (XOF)"
                  value={line.unitPrice}
                  onChange={(e) => handleLineChange(idx, 'unitPrice', Number(e.target.value))}
                  style={{ width: 100, padding: '8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
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
                background: '#F1F5F9',
                color: '#334155',
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

          <div style={{ textAlign: 'right', marginTop: 10, fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
            Total Estimé : {calculateTotal().toLocaleString()} XOF
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #CBD5E1', background: 'white', cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: themeColor, color: 'white', fontWeight: 700, cursor: 'pointer' }}
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
        clientName={printDoc.clientName}
        clientPhone={printDoc.clientPhone}
        items={printDoc.items}
        themeColor={themeColor}
      />
    </div>
  );
};

