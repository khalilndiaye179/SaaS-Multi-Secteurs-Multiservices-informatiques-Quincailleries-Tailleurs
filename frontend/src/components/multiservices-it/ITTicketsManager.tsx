import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';
import { DocumentPrintModal } from '../shared/DocumentPrintModal';

interface RepairTicket {
  id: string;
  ticketNumber: string;
  clientName: string;
  clientPhone: string;
  deviceModel: string;
  issueDesc: string;
  status: 'RECEIVED' | 'DIAGNOSIS' | 'IN_REPAIR' | 'READY' | 'DELIVERED' | 'IMPOSSIBLE' | 'CANCELLED';
  cancelReason?: string;
  estimatedCost?: number;
  finalCost?: number;
  notes?: string;
  createdAt: string;
}

interface Props {
  themeColor: string;
}

export const ITTicketsManager: React.FC<Props> = ({ themeColor }) => {
  const user = JSON.parse(localStorage.getItem('kpsy_user') || '{}');
  const isAdmin = !user?.roles || user?.roles?.length === 0 || user?.roles?.includes('TENANT_ADMIN') || user?.roles?.includes('ADMIN_TENANT') || user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN');

  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null);


  // Form states
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(15000);
  const [newStatus, setNewStatus] = useState<RepairTicket['status']>('RECEIVED');
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);


  // Print Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printDoc, setPrintDoc] = useState<{
    number: string;
    date: string;
    clientName: string;
    clientPhone?: string;
    items: Array<{ description: string; quantity: number; unitPrice: number }>;
  }>({
    number: '',
    date: '',
    clientName: '',
    items: [],
  });

  const handlePrintTicket = (t: RepairTicket) => {
    if (!t) return;
    setPrintDoc({
      number: t.ticketNumber || 'TCK-2026-0000',
      date: t.createdAt ? new Date(t.createdAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
      clientName: t.clientName || 'Client',
      clientPhone: t.clientPhone,
      items: [
        { description: `Panne & Diagnostic : ${t.deviceModel || 'Appareil'} — ${t.issueDesc || 'Diagnostic'}`, quantity: 1, unitPrice: t.estimatedCost || 0 },
      ],
    });
    setShowPrintModal(true);
  };

  const token = localStorage.getItem('kpsy_token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/multiservices-it/tickets', { headers });
      if (res.ok) {
        const data = await res.json();
        setTickets(Array.isArray(data) ? data : []);
      } else {
        setTickets([]);
      }
    } catch (e) {
      console.error(e);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleOpenAdd = () => {
    setEditingTicketId(null);
    setClientName('');
    setClientPhone('');
    setDeviceModel('');
    setIssueDesc('');
    setEstimatedCost(15000);
    setShowModal(true);
  };

  const handleOpenEdit = (t: RepairTicket) => {
    if (!isAdmin) {
      alert('Action de modification réservée à l\'Administrateur.');
      return;
    }
    setEditingTicketId(t.id);
    setClientName(t.clientName || '');
    setClientPhone(t.clientPhone || '');
    setDeviceModel(t.deviceModel || '');
    setIssueDesc(t.issueDesc || '');
    setEstimatedCost(t.estimatedCost || 15000);
    setShowModal(true);
  };

  const handleDeleteTicket = async (id: string) => {
    if (!isAdmin) {
      alert('Action de suppression réservée à l\'Administrateur.');
      return;
    }
    if (!window.confirm('Voulez-vous vraiment supprimer ce ticket SAV ?')) return;

    try {
      const res = await fetch(`/api/multiservices-it/tickets/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        setTickets(tickets.filter((t) => t.id !== id));
      } else {
        setTickets(tickets.filter((t) => t.id !== id));
      }
    } catch (e) {
      console.error(e);
      setTickets(tickets.filter((t) => t.id !== id));
    }
  };

  const handleCreateOrUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingTicketId) {
        setTickets(
          tickets.map((t) =>
            t.id === editingTicketId
              ? { ...t, clientName, clientPhone, deviceModel, issueDesc, estimatedCost }
              : t
          )
        );
        setShowModal(false);
      } else {
        const res = await fetch('/api/multiservices-it/tickets', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            clientName,
            clientPhone,
            deviceModel,
            issueDesc,
            estimatedCost,
          }),
        });

        if (res.ok) {
          setShowModal(false);
          setClientName('');
          setClientPhone('');
          setDeviceModel('');
          setIssueDesc('');
          fetchTickets();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };


  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/multiservices-it/tickets/${selectedTicket.id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setShowStatusModal(false);
        fetchTickets();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status?: RepairTicket['status']) => {
    const config: Record<string, { bg: string; color: string; label: string }> = {
      RECEIVED: { bg: '#FEF3C7', color: '#92400E', label: 'Reçu Atelier' },
      DIAGNOSIS: { bg: '#E0E7FF', color: '#3730A3', label: 'Diagnostic' },
      IN_REPAIR: { bg: '#FCE7F3', color: '#9D174D', label: 'Réparation' },
      READY: { bg: '#D1FAE5', color: '#065F46', label: 'Prêt (Testé)' },
      DELIVERED: { bg: '#F3F4F6', color: '#4B5563', label: 'Restitué' },
      IMPOSSIBLE: { bg: '#FEE2E2', color: '#DC2626', label: 'Dépannage Impossible ❌' },
      CANCELLED: { bg: '#F1F5F9', color: '#64748B', label: 'Client Désisté 🚫' },
    };
    const key = status && config[status] ? status : 'RECEIVED';
    const c = config[key];
    return (
      <span style={{ padding: '4px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.75rem', background: c.bg, color: c.color }}>
        {c.label}
      </span>
    );
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: '#111827' }}>
            Tickets de Réparation SAV ({tickets ? tickets.length : 0})
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
            Gestion des fiches de dépôt, statut d'atelier et devis de réparation
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
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
          + Nouveau Ticket (TCK-2026-XXXX)
        </button>
      </div>

      {/* Table Tickets */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Chargement des tickets...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <tr>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>N° Ticket</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Client</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Appareil / Modèle</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Panne Déclarée</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Statut SAV</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Devis Est. (XOF)</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {!Array.isArray(tickets) || tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
                    Aucun ticket de réparation enregistré pour le moment.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t?.id || Math.random()} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: themeColor }}>{t?.ticketNumber || 'TCK-2026-0000'}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600 }}>{t?.clientName || 'Client'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{t?.clientPhone || '—'}</div>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 600 }}>{t?.deviceModel || 'Appareil'}</td>
                    <td style={{ padding: '14px 18px', color: '#4B5563' }}>{t?.issueDesc || '—'}</td>
                    <td style={{ padding: '14px 18px' }}>{getStatusBadge(t?.status)}</td>
                    <td style={{ padding: '14px 18px', fontWeight: 800, color: '#0F172A' }}>
                      {t?.estimatedCost ? `${Number(t.estimatedCost).toLocaleString()} XOF` : 'N/A'}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => {
                            setSelectedTicket(t);
                            setNewStatus(t?.status || 'RECEIVED');
                            setShowStatusModal(true);
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            background: themeColor,
                            color: 'white',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Statut ⚙️
                        </button>
                        <button
                          onClick={() => handlePrintTicket(t)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            border: '1px solid #D1D5DB',
                            background: 'white',
                            color: '#374151',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          🖨️ PDF
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(t)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 6,
                                border: '1px solid #CBD5E1',
                                background: 'white',
                                color: '#1E293B',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              ✏️ Edit
                            </button>
                            {t?.status !== 'CANCELLED' && (
                              <button
                                onClick={() => {
                                  setSelectedTicket(t);
                                  setNewStatus('CANCELLED');
                                  setShowStatusModal(true);
                                }}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: 6,
                                  border: 'none',
                                  background: '#FEF2F2',
                                  color: '#DC2626',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                🚫 Annulation + Motif
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteTicket(t.id)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 6,
                                border: 'none',
                                background: '#FEE2E2',
                                color: '#DC2626',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              🗑️
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
        )}
      </div>

      {/* Modal Création / Modification Ticket */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTicketId ? "Modifier le Ticket SAV" : "Créer un Ticket de Réparation SAV"}>
        <form onSubmit={handleCreateOrUpdateTicket} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
              Nom Complet du Client
            </label>
            <input
              required
              placeholder="ex: Mamadou Diallo"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
              Numéro Téléphone Client
            </label>
            <input
              required
              placeholder="ex: +221 77 000 00 00"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
              Modèle & Marque Appareil
            </label>
            <input
              required
              placeholder="ex: HP EliteBook 840 G5 / iPhone 13 Pro"
              value={deviceModel}
              onChange={(e) => setDeviceModel(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
              Description de la Panne Déclarée
            </label>
            <textarea
              required
              rows={3}
              placeholder="ex: Écran noir après chute, connecteur de charge cassé"
              value={issueDesc}
              onChange={(e) => setIssueDesc(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
              Devis Estimatif Initial (XOF)
            </label>
            <input
              type="number"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(Number(e.target.value))}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: 12,
              borderRadius: 8,
              border: 'none',
              background: themeColor,
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: 10,
            }}
          >
            {submitting ? 'Enregistrement...' : 'Enregistrer le Ticket'}
          </button>
        </form>
      </Modal>

      {/* Modal Changement Statut SAV */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Mettre à jour le Statut du Ticket SAV">
        <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              Avancement de la Réparation
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as any)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB', fontWeight: 600 }}
            >
              <option value="RECEIVED">1. Reçu à l'Atelier</option>
              <option value="DIAGNOSIS">2. Diagnostic en cours</option>
              <option value="IN_REPAIR">3. Réparation en cours</option>
              <option value="READY">4. Prêt & Testé (Attente client)</option>
              <option value="DELIVERED">5. Restitué au client</option>
              <option value="IMPOSSIBLE">6. ❌ Dépannage Impossible (Inréparable)</option>
              <option value="CANCELLED">7. 🚫 Client Désisté / Annulé</option>
            </select>
          </div>

          {(newStatus === 'CANCELLED' || newStatus === 'IMPOSSIBLE') && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#DC2626', marginBottom: 4 }}>
                Motif d'Annulation ou d'Incapacité Technique (Obligatoire)
              </label>
              <textarea
                required
                rows={2}
                placeholder="ex: Client a refusé le devis / Carte mère irrécupérable..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #FCA5A5' }}
              />
            </div>
          )}


          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: 12,
              borderRadius: 8,
              border: 'none',
              background: themeColor,
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: 10,
            }}
          >
            {submitting ? 'Mise à jour...' : 'Mettre à jour le statut'}
          </button>
        </form>
      </Modal>

      {/* Modal d'Impression du Ticket SAV */}
      <DocumentPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title={`Impression Ticket SAV : ${printDoc.number}`}
        documentType="TICKET_SAV"
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
