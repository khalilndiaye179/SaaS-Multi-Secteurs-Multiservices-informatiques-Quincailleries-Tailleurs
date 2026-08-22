import React, { useState, useEffect } from 'react';
import { SuperAdminApiService, SaaSQuoteData } from '../../services/super-admin-api.service';
import { ForbiddenState } from './ForbiddenState';
import { SaaSQuotePrintModal } from './SaaSQuotePrintModal';

interface Props {
  themeColor?: string;
}

export const SaaSQuotesView: React.FC<Props> = ({ themeColor = '#312E81' }) => {
  const [quotes, setQuotes] = useState<SaaSQuoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  
  // Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printQuote, setPrintQuote] = useState<SaaSQuoteData | null>(null);

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    planName: 'Tarif Standard UEMOA',
    durationMonths: 12,
    discount: 0,
    subtotal: 78000,
  });

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await SuperAdminApiService.getSaaSQuotes();
      setQuotes(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des devis.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingQuoteId) {
        await SuperAdminApiService.updateSaaSQuote(editingQuoteId, formData);
        alert('✅ Devis commercial mis à jour avec succès !');
      } else {
        await SuperAdminApiService.createSaaSQuote(formData);
        alert('✅ Devis commercial créé avec succès !');
      }
      setIsModalOpen(false);
      setEditingQuoteId(null);
      setFormData({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        planName: 'Tarif Standard UEMOA',
        durationMonths: 12,
        discount: 0,
        subtotal: 78000,
      });
      fetchQuotes();
    } catch (err: any) {
      alert(`⚠️ Échec de ${editingQuoteId ? 'mise à jour' : 'création'} : ${err.message}`);
    }
  };

  const handleEdit = (quote: SaaSQuoteData) => {
    setFormData({
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
      clientPhone: quote.clientPhone || '',
      planName: quote.planName,
      durationMonths: quote.durationMonths,
      discount: quote.discount,
      subtotal: quote.subtotal,
    });
    setEditingQuoteId(quote.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce devis ?")) return;
    try {
      await SuperAdminApiService.deleteSaaSQuote(id);
      alert('✅ Devis supprimé avec succès !');
      fetchQuotes();
    } catch (err: any) {
      alert(`Erreur lors de la suppression : ${err.message}`);
    }
  };

  const handleConvert = async (quoteId: string) => {
    try {
      const res = await SuperAdminApiService.convertSaaSQuote(quoteId);
      alert(res.message || 'Devis converti en abonnement avec succès !');
      fetchQuotes();
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const handleOpenPrintModal = (quote: SaaSQuoteData) => {
    setPrintQuote(quote);
    setIsPrintModalOpen(true);
  };

  const handleDownloadPdf = async (quoteId: string, quoteNumber: string) => {
    try {
      await SuperAdminApiService.downloadSaaSQuotePdf(quoteId, quoteNumber);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des devis commerciaux...</div>;
  if (error?.includes('403')) return <ForbiddenState message="Seuls les rôles SUPER_ADMIN et FINANCE ont accès à la gestion des devis commerciaux." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0, fontFamily: "'Sora', sans-serif" }}>📝 Devis Commercial SaaS</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Émission, suivi et conversion des devis SQ-2026-XXXX</p>
        </div>
        <button
          onClick={() => {
            setEditingQuoteId(null);
            setFormData({
              clientName: '',
              clientEmail: '',
              clientPhone: '',
              planName: 'Tarif Standard UEMOA',
              durationMonths: 12,
              discount: 0,
              subtotal: 78000,
            });
            setIsModalOpen(true);
          }}
          style={{
            background: themeColor,
            color: 'var(--text-inverse)',
            border: 'none',
            padding: '11px 20px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: `0 4px 14px ${themeColor}40`,
          }}
        >
          ➕ Émettre un Devis SaaS
        </button>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '14px 20px' }}>Numéro</th>
              <th style={{ padding: '14px 20px' }}>Client</th>
              <th style={{ padding: '14px 20px' }}>Durée</th>
              <th style={{ padding: '14px 20px' }}>Sous-Total</th>
              <th style={{ padding: '14px 20px' }}>Remise</th>
              <th style={{ padding: '14px 20px' }}>Total</th>
              <th style={{ padding: '14px 20px' }}>Statut</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Aucun devis commercial enregistré.
                </td>
              </tr>
            ) : (
              quotes.map((q) => (
                <tr key={q.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: themeColor }}>{q.quoteNumber}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div><strong>{q.clientName}</strong></div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{q.clientEmail}</div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>{q.durationMonths} mois</td>
                  <td style={{ padding: '14px 20px' }}>{q.subtotal.toLocaleString()} {q.currency}</td>
                  <td style={{ padding: '14px 20px', color: '#166534' }}>-{q.discount.toLocaleString()} {q.currency}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 700 }}>{q.total.toLocaleString()} {q.currency}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: q.status === 'CONVERTED' ? '#DCFCE7' : '#FEF3C7', color: q.status === 'CONVERTED' ? '#166534' : '#D97706' }}>
                      {q.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleOpenPrintModal(q)}
                        style={{ padding: '6px 12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        👁️ Visionner / PDF
                      </button>
                      <button
                        onClick={() => handleDownloadPdf(q.id, q.quoteNumber)}
                        style={{ padding: '6px 12px', background: '#3B82F6', color: 'var(--text-inverse)', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        📥 Télécharger
                      </button>
                      {q.status !== 'CONVERTED' && (
                        <>
                          <button
                            onClick={() => handleConvert(q.id)}
                            style={{ padding: '6px 12px', background: '#0F172A', color: 'var(--text-inverse)', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Convertir
                          </button>
                          <button
                            onClick={() => handleEdit(q)}
                            style={{ padding: '6px 12px', background: '#3B82F6', color: 'var(--text-inverse)', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(q.id)}
                            style={{ padding: '6px 12px', background: '#EF4444', color: 'var(--text-inverse)', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CRÉATION DEVIS COMMERCIAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', padding: 28, borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 4px 0', fontFamily: "'Sora', sans-serif", fontWeight: 800 }}>{editingQuoteId ? '✏️ Modifier un Devis' : '📝 Émettre un Devis Commercial SaaS'}</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{editingQuoteId ? 'Modification des informations du devis' : "Génération d'une proposition tarifaire officielle avec numéro de devis automatique"}</p>

            <form onSubmit={handleCreateQuote} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Nom ou Raison Sociale Client</label>
                <input
                  type="text" required
                  placeholder="ex: QNC Touba Matériaux"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Email Client</label>
                  <input
                    type="email" required
                    placeholder="contact@client.sn"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Téléphone Client</label>
                  <input
                    type="text"
                    placeholder="+221 77 000 00 00"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Durée Engagement</label>
                  <select
                    value={formData.durationMonths}
                    onChange={(e) => {
                      const dur = Number(e.target.value);
                      const sub = dur * 6500;
                      const disc = dur === 12 ? Math.round(sub * 0.2) : dur === 6 ? Math.round(sub * 0.1) : 0;
                      setFormData({ ...formData, durationMonths: dur, subtotal: sub, discount: disc });
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                  >
                    <option value={1}>1 Mois (Mensuel)</option>
                    <option value={6}>6 Mois (-10% Semestriel)</option>
                    <option value={12}>12 Mois (-20% Annuel)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Nom du Plan Tarifaire</label>
                  <input
                    type="text" required
                    value={formData.planName}
                    onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Sous-Total (XOF)</label>
                  <input
                    type="number" required
                    value={formData.subtotal}
                    onChange={(e) => setFormData({ ...formData, subtotal: Number(e.target.value) })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Remise Commerciale (XOF)</label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                  />
                </div>
              </div>

              <div style={{ padding: 12, background: 'var(--bg-main)', borderRadius: 8, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Total Final estimé :</span>
                <strong style={{ fontSize: 16, color: themeColor }}>{(formData.subtotal - formData.discount).toLocaleString()} XOF</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', fontWeight: 700, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: themeColor, color: 'var(--text-inverse)', fontWeight: 800, cursor: 'pointer' }}>
                  {editingQuoteId ? 'Enregistrer les modifications' : 'Générer le Devis SaaS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPRESSION / GED */}
      {printQuote && (
        <SaaSQuotePrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          quoteNumber={printQuote.quoteNumber}
          clientName={printQuote.clientName}
          clientPhone={printQuote.clientPhone}
          clientEmail={printQuote.clientEmail}
          planName={printQuote.planName}
          durationMonths={printQuote.durationMonths}
          subtotal={printQuote.subtotal}
          discount={printQuote.discount}
          total={printQuote.total}
          currency={printQuote.currency}
          createdAt={printQuote.createdAt}
          themeColor={themeColor}
        />
      )}
    </div>
  );
};
