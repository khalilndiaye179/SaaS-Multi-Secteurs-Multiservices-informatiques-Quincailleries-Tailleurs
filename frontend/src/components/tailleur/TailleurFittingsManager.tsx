import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';
import { DocumentPrintModal } from '../shared/DocumentPrintModal';

interface FittingAppointment {
  id: string;
  orderNumber: string;
  clientName: string;
  clientPhone: string;
  garmentType: string;
  fittingDate?: string;
  deliveryDate?: string;
  totalPrice?: number;
  advancePaid?: number;
  status: string;
}

interface Props {
  themeColor: string;
}

export const TailleurFittingsManager: React.FC<Props> = ({ themeColor }) => {
  const [fittings, setFittings] = useState<FittingAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals state
  const [selectedFitting, setSelectedFitting] = useState<FittingAppointment | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Dates state
  const [newFittingDate, setNewFittingDate] = useState('');
  const [newDeliveryDate, setNewDeliveryDate] = useState('');

  // Form edit state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [garmentType, setGarmentType] = useState('');

  // Print modal state
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

  const currentUser = JSON.parse(localStorage.getItem('kpsy_user') || '{}');
  const isAdmin = !currentUser?.roles || currentUser?.roles?.length === 0 || currentUser?.roles?.includes('TENANT_ADMIN') || currentUser?.roles?.includes('ADMIN_TENANT') || currentUser?.roles?.includes('ADMIN') || currentUser?.roles?.includes('SUPER_ADMIN');

  const fetchFittings = async () => {
    setLoading(true);
    const token = localStorage.getItem('kpsy_token');
    try {
      const res = await fetch('/api/tailleur/measurements/orders/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const orders = await res.json();
        setFittings(
          orders.filter((o: any) => o.status === 'FITTING' || o.fittingDate || o.deliveryDate)
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFittings();
  }, []);

  const handleOpenReschedule = (f: FittingAppointment) => {
    setSelectedFitting(f);
    setNewFittingDate(f.fittingDate ? f.fittingDate.split('T')[0] : '');
    setNewDeliveryDate(f.deliveryDate ? f.deliveryDate.split('T')[0] : '');
    setShowRescheduleModal(true);
  };

  const handleOpenEdit = (f: FittingAppointment) => {
    setSelectedFitting(f);
    setClientName(f.clientName);
    setClientPhone(f.clientPhone);
    setGarmentType(f.garmentType);
    setNewFittingDate(f.fittingDate ? f.fittingDate.split('T')[0] : '');
    setNewDeliveryDate(f.deliveryDate ? f.deliveryDate.split('T')[0] : '');
    setShowEditModal(true);
  };

  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFitting) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('kpsy_token');
      const res = await fetch(`/api/tailleur/measurements/orders/${selectedFitting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fittingDate: newFittingDate ? new Date(newFittingDate).toISOString() : undefined,
          deliveryDate: newDeliveryDate ? new Date(newDeliveryDate).toISOString() : undefined,
        }),
      });

      if (res.ok) {
        setShowRescheduleModal(false);
        fetchFittings();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFitting) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('kpsy_token');
      const res = await fetch(`/api/tailleur/measurements/orders/${selectedFitting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          clientName,
          clientPhone,
          garmentType,
          fittingDate: newFittingDate ? new Date(newFittingDate).toISOString() : undefined,
          deliveryDate: newDeliveryDate ? new Date(newDeliveryDate).toISOString() : undefined,
        }),
      });

      if (res.ok) {
        setShowEditModal(false);
        fetchFittings();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      alert('Action réservée exclusivement à l\'Administrateur de l\'atelier.');
      return;
    }
    if (!window.confirm('⚠️ SUPPRESSION : Voulez-vous vraiment supprimer ce rendez-vous / commande ?')) return;
    try {
      const token = localStorage.getItem('kpsy_token');
      const res = await fetch(`/api/tailleur/measurements/orders/${id}/delete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchFittings();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = (f: FittingAppointment) => {
    const advancePaid = f.advancePaid ?? 0;
    const totalPrice = f.totalPrice ?? 0;
    setPrintDoc({
      number: f.orderNumber || 'CMD-000',
      date: new Date().toLocaleDateString('fr-FR'),
      clientName: f.clientName,
      clientPhone: f.clientPhone,
      items: [
        { description: `Rendez-vous Essayage / Confection : ${f.garmentType} (Statut: ${f.status})`, quantity: 1, unitPrice: totalPrice },
      ],
    });
    setShowPrintModal(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: '#111827' }}>
          Agenda des Essayages & Livraisons ({fittings.length})
        </h2>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
          Planning des rendez-vous clients d'essayage de tenue et dates de livraison prévues
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Chargement du planning...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <tr>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>N° Commande</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Client</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Modèle</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Date d'Essayage</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Date Livraison Prévue</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Statut</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fittings.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
                    Aucun rendez-vous d'essayage planifié pour le moment.
                  </td>
                </tr>
              ) : (
                fittings.map((f) => (
                  <tr key={f.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: themeColor }}>{f.orderNumber}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600 }}>{f.clientName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{f.clientPhone}</div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>{f.garmentType}</td>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#6B21A8' }}>
                      {f.fittingDate ? new Date(f.fittingDate).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#059669' }}>
                      {f.deliveryDate ? new Date(f.deliveryDate).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 20, background: '#EDE9FE', color: '#5B21B6', fontWeight: 700, fontSize: '0.75rem' }}>
                        {f.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleOpenReschedule(f)}
                          style={{
                            padding: '5px 9px',
                            borderRadius: 6,
                            background: themeColor,
                            color: 'white',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          📅 Reprogrammer
                        </button>
                        <button
                          onClick={() => handlePrint(f)}
                          style={{
                            padding: '5px 9px',
                            borderRadius: 6,
                            border: '1px solid #CBD5E1',
                            background: 'white',
                            color: '#1E293B',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          👁️ / 🖨️ PDF
                        </button>
                        <button
                          onClick={() => handleOpenEdit(f)}
                          style={{
                            padding: '5px 9px',
                            borderRadius: 6,
                            border: '1px solid #CBD5E1',
                            background: 'white',
                            color: '#1E293B',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          ✏️
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(f.id)}
                            style={{
                              padding: '5px 9px',
                              borderRadius: 6,
                              border: 'none',
                              background: '#FEE2E2',
                              color: '#DC2626',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                            title="Suppression réservée à l'Administrateur"
                          >
                            🗑️
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

      {/* Modal Reprogrammer Dates */}
      <Modal isOpen={showRescheduleModal} onClose={() => setShowRescheduleModal(false)} title={`Reprogrammer le Rendez-vous : ${selectedFitting?.orderNumber}`}>
        <form onSubmit={handleSaveReschedule} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
              Nouvelle Date d'Essayage
            </label>
            <input
              type="date"
              value={newFittingDate}
              onChange={(e) => setNewFittingDate(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
              Nouvelle Date de Livraison Prévue
            </label>
            <input
              type="date"
              value={newDeliveryDate}
              onChange={(e) => setNewDeliveryDate(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={() => setShowRescheduleModal(false)}
              style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #CBD5E1', background: 'white', fontWeight: 600, cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: themeColor, color: 'white', fontWeight: 700, cursor: 'pointer' }}
            >
              {submitting ? 'Enregistrement...' : 'Enregistrer les Dates'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Modifier */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Modifier la Fiche d'Essayage : ${selectedFitting?.orderNumber}`}>
        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Nom du Client</label>
            <input
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Téléphone</label>
            <input
              required
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Modèle / Vêtement</label>
            <input
              required
              value={garmentType}
              onChange={(e) => setGarmentType(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #CBD5E1', background: 'white', fontWeight: 600, cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: themeColor, color: 'white', fontWeight: 700, cursor: 'pointer' }}
            >
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Document PDF Modal */}
      <DocumentPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title={`Impression Fiche Essayage : ${printDoc.number}`}
        documentType="FICHE_ESSAYAGE"
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

