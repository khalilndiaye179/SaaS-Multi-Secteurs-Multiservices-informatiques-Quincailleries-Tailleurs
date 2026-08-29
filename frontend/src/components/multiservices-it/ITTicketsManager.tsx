import { StorageService } from '../../services/storage';
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
  status: 'RECEIVED' | 'DIAGNOSIS' | 'IN_REPAIR' | 'READY' | 'DELIVERED' | 'IMPOSSIBLE' | 'CANCELLED' | 'CONVERTED_TO_STOCK';
  cancelReason?: string;
  estimatedCost?: number;
  finalCost?: number;
  notes?: string;
  photoBefore?: string;
  photoAfter?: string;
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
  const [photoBefore, setPhotoBefore] = useState<string>('');
  const [photoAfter, setPhotoAfter] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Stock and used parts states
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [usedParts, setUsedParts] = useState<Array<{ stockItemId: string; quantity: number }>>([]);

  // Convert to Stock State
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertToStockForm, setConvertToStockForm] = useState({
    sku: '',
    purchasePrice: 0,
    sellingPrice: 0,
    unit: 'pièce',
  });

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

  let token;
    StorageService.get("kpsy_token").then(t => token = t);
    // FIXME: token fetch is now async, might break sync logic
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

  const fetchStockItems = async () => {
    try {
      const res = await fetch('/api/quincaillerie/stock', { headers });
      if (res.ok) {
        const data = await res.json();
        setStockItems(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchStockItems();
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

  const handleOpenConvertModal = (t: RepairTicket) => {
    if (!isAdmin) {
      alert('Action réservée à l\'Administrateur.');
      return;
    }
    setSelectedTicket(t);
    setConvertToStockForm({
      sku: `REF-${Math.floor(Math.random() * 100000)}`,
      purchasePrice: t.finalCost || t.estimatedCost || 0,
      sellingPrice: (t.finalCost || t.estimatedCost || 0) * 1.5,
      unit: 'pièce',
    });
    setShowConvertModal(true);
  };

  const handleConvertToStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/multiservices-it/tickets/${selectedTicket.id}/convert-to-stock`, {
        method: 'POST',
        headers,
        body: JSON.stringify(convertToStockForm),
      });
      if (res.ok) {
        setShowConvertModal(false);
        fetchTickets();
        fetchStockItems(); // refresh stock
        alert('Ticket converti en stock avec succès !');
      } else {
        const err = await res.json();
        alert(`Erreur : ${err.message}`);
      }
    } catch (e) {
      console.error(e);
      alert('Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };


  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setSubmitting(true);
    try {
      const payload: any = { status: newStatus, usedParts, photoBefore: photoBefore || undefined, photoAfter: photoAfter || undefined };
      if (newStatus === 'CANCELLED' || newStatus === 'IMPOSSIBLE') {
        payload.notes = cancelReason;
      }
      
      const res = await fetch(`/api/multiservices-it/tickets/${selectedTicket.id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowStatusModal(false);
        fetchTickets();
      } else {
        const err = await res.json();
        alert(`Erreur : ${err.message || 'Impossible de mettre à jour le statut'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Une erreur réseau est survenue.');
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
      DELIVERED: { bg: '#F3F4F6', color: 'var(--text-muted)', label: 'Restitué' },
      IMPOSSIBLE: { bg: '#FEE2E2', color: '#DC2626', label: 'Dépannage Impossible ❌' },
      CANCELLED: { bg: '#F1F5F9', color: 'var(--text-muted)', label: 'Client Désisté 🚫' },
      CONVERTED_TO_STOCK: { bg: '#F3E8FF', color: '#7E22CE', label: 'En Stock (Reconditionné)' },
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
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: 'var(--text-main)' }}>
            Tickets de Réparation SAV ({tickets ? tickets.length : 0})
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Gestion des fiches de dépôt, statut d'atelier et devis de réparation
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
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
          + Nouveau Ticket (TCK-2026-XXXX)
        </button>
      </div>

      {/* Table Tickets */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des tickets...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
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
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Aucun ticket de réparation enregistré pour le moment.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t?.id || Math.random()} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: themeColor }}>{t?.ticketNumber || 'TCK-2026-0000'}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600 }}>{t?.clientName || 'Client'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t?.clientPhone || '—'}</div>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 600 }}>{t?.deviceModel || 'Appareil'}</td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{t?.issueDesc || '—'}</td>
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
                            setUsedParts([]); // Reset used parts
                            setCancelReason(t?.notes || '');
                            setPhotoBefore(t?.photoBefore || '');
                            setPhotoAfter(t?.photoAfter || '');
                            setShowStatusModal(true);
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            background: themeColor,
                            color: 'var(--text-inverse)',
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
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-muted)',
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
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-main)',
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
                                  setCancelReason(t?.notes || '');
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
                              {t?.status !== 'CANCELLED' && t?.status !== 'DELIVERED' && t?.status !== 'CONVERTED_TO_STOCK' && (
                                <button
                                  onClick={() => handleOpenConvertModal(t)}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: 6,
                                    border: '1px solid #E9D5FF',
                                    background: '#FAF5FF',
                                    color: '#7E22CE',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  🔄 Stock
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
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
              Nom Complet du Client
            </label>
            <input
              required
              placeholder="ex: Mamadou Diallo"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
              Numéro Téléphone Client
            </label>
            <input
              required
              placeholder="ex: +221 77 000 00 00"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
              Modèle & Marque Appareil
            </label>
            <input
              required
              placeholder="ex: HP EliteBook 840 G5 / iPhone 13 Pro"
              value={deviceModel}
              onChange={(e) => setDeviceModel(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
              Description de la Panne Déclarée
            </label>
            <textarea
              required
              rows={3}
              placeholder="ex: Écran noir après chute, connecteur de charge cassé"
              value={issueDesc}
              onChange={(e) => setIssueDesc(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
              Devis Estimatif Initial (XOF)
            </label>
            <input
              type="number"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(Number(e.target.value))}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
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
              color: 'var(--text-inverse)',
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
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
              Avancement de la Réparation
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as any)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)', fontWeight: 600 }}
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

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
              Preuve Photo : Avant réparation
            </label>
            {photoBefore && <img src={photoBefore} alt="Avant" style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8, marginBottom: 8, objectFit: 'cover' }} />}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => setPhotoBefore(ev.target?.result as string);
                  reader.readAsDataURL(file);
                }
              }}
              style={{ width: '100%', fontSize: '0.75rem' }}
            />
          </div>

          {(newStatus === 'READY' || newStatus === 'DELIVERED') && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                Preuve Photo : Après réparation
              </label>
              {photoAfter && <img src={photoAfter} alt="Après" style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8, marginBottom: 8, objectFit: 'cover' }} />}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setPhotoAfter(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ width: '100%', fontSize: '0.75rem' }}
              />
            </div>
          )}

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

          {(newStatus === 'READY' || newStatus === 'DELIVERED') && (
            <div style={{ background: 'var(--bg-main)', padding: 12, borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                Pièces de rechange utilisées (Stock)
              </label>
              {usedParts.map((up, idx) => {
                const item = stockItems.find(si => si.id === up.stockItemId);
                return (
                  <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center' }}>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{item?.name || 'Pièce inconnue'}</div>
                    <input
                      type="number"
                      min="1"
                      value={up.quantity}
                      onChange={(e) => {
                        const newParts = [...usedParts];
                        newParts[idx].quantity = Number(e.target.value);
                        setUsedParts(newParts);
                      }}
                      style={{ width: 60, padding: 6, borderRadius: 4, border: '1px solid var(--border-color)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setUsedParts(usedParts.filter((_, i) => i !== idx))}
                      style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontWeight: 700 }}
                    >
                      X
                    </button>
                  </div>
                );
              })}
              
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <select
                  id="part-select"
                  style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 13 }}
                  defaultValue=""
                >
                  <option value="" disabled>-- Ajouter une pièce --</option>
                  {stockItems.map(si => (
                    <option key={si.id} value={si.id}>{si.name} ({si.quantity} en stock)</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const select = document.getElementById('part-select') as HTMLSelectElement;
                    const val = select.value;
                    if (val && !usedParts.find(up => up.stockItemId === val)) {
                      setUsedParts([...usedParts, { stockItemId: val, quantity: 1 }]);
                      select.value = "";
                    }
                  }}
                  style={{ padding: '8px 12px', background: '#374151', color: 'var(--text-inverse)', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                >
                  Ajouter
                </button>
              </div>
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
              color: 'var(--text-inverse)',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: 10,
            }}
          >
            {submitting ? 'Mise à jour...' : 'Mettre à jour le statut'}
          </button>
        </form>
      </Modal>

      {/* Modal Convert to Stock */}
      <Modal isOpen={showConvertModal} onClose={() => setShowConvertModal(false)} title="Convertir en Article de Stock (Reconditionné)">
        <form onSubmit={handleConvertToStock} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 10 }}>
            L'appareil <strong>{selectedTicket?.deviceModel}</strong> (Ticket {selectedTicket?.ticketNumber}) sera ajouté à votre inventaire. Son statut passera en <em>En Stock (Reconditionné)</em>.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
              Référence (SKU)
            </label>
            <input
              required
              value={convertToStockForm.sku}
              onChange={(e) => setConvertToStockForm({ ...convertToStockForm, sku: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
              Coût d'Acquisition (XOF)
            </label>
            <input
              required
              type="number"
              min="0"
              value={convertToStockForm.purchasePrice}
              onChange={(e) => setConvertToStockForm({ ...convertToStockForm, purchasePrice: Number(e.target.value) })}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
            />
            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>Prix de rachat au client ou coût total des réparations.</small>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
              Prix de Revente Estimé (XOF)
            </label>
            <input
              required
              type="number"
              min="0"
              value={convertToStockForm.sellingPrice}
              onChange={(e) => setConvertToStockForm({ ...convertToStockForm, sellingPrice: Number(e.target.value) })}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
              Unité
            </label>
            <select
              value={convertToStockForm.unit}
              onChange={(e) => setConvertToStockForm({ ...convertToStockForm, unit: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
            >
              <option value="pièce">Pièce</option>
              <option value="lot">Lot</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: 12,
              borderRadius: 8,
              border: 'none',
              background: '#7E22CE',
              color: 'var(--text-inverse)',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: 10,
            }}
          >
            {submitting ? 'Conversion en cours...' : 'Valider la Conversion'}
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
