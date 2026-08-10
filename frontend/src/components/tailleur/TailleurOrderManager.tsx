import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';
import { DocumentPrintModal } from '../shared/DocumentPrintModal';

interface TailleurOrder {
  id: string;
  orderNumber: string;
  clientName: string;
  clientPhone: string;
  garmentType: string;
  totalPrice?: number;
  totalAmount?: number;
  advancePaid: number;
  remainingAmount?: number;
  status: 'ORDERED' | 'CUTTING' | 'SEWING' | 'FITTING' | 'READY' | 'DELIVERED';
  fittingDate?: string;
  deliveryDate?: string;
  createdAt: string;
}


interface ClientMeasurement {
  id: string;
  clientName: string;
  clientPhone: string;
}

interface Props {
  themeColor: string;
}

export const TailleurOrderManager: React.FC<Props> = ({ themeColor }) => {
  const [orders, setOrders] = useState<TailleurOrder[]>([]);
  const [clients, setClients] = useState<ClientMeasurement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<TailleurOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);


  // Form New Order
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Form Edit & Cancel
  const [editingOrder, setEditingOrder] = useState<TailleurOrder | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('kpsy_user') || '{}');
  const isAdmin = !currentUser?.roles || currentUser?.roles?.length === 0 || currentUser?.roles?.includes('TENANT_ADMIN') || currentUser?.roles?.includes('ADMIN_TENANT') || currentUser?.roles?.includes('ADMIN') || currentUser?.roles?.includes('SUPER_ADMIN');

  const handleOpenEdit = (o: TailleurOrder) => {
    setEditingOrder(o);
    setClientName(o.clientName);
    setClientPhone(o.clientPhone);
    setGarmentType(o.garmentType);
    setTotalAmount(o.totalPrice ?? o.totalAmount ?? 0);
    setAdvancePaid(o.advancePaid ?? 0);
    setFittingDate(o.fittingDate ? o.fittingDate.split('T')[0] : '');
    setDeliveryDate(o.deliveryDate ? o.deliveryDate.split('T')[0] : '');
    setShowEditModal(true);
  };

  const handleOpenCancel = (o: TailleurOrder) => {
    setSelectedOrder(o);
    setCancellationReason('');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('kpsy_token');
      const res = await fetch(`/api/tailleur/measurements/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status: 'CANCELLED',
          cancellationReason: cancellationReason || 'Annulation par le client',
        }),
      });

      if (res.ok) {
        setShowCancelModal(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('kpsy_token');
      const res = await fetch(`/api/tailleur/measurements/orders/${editingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          clientName,
          clientPhone,
          garmentType,
          totalPrice: Number(totalAmount),
          advancePaid: Number(advancePaid),
          fittingDate: fittingDate ? new Date(fittingDate).toISOString() : undefined,
          deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        }),
      });

      if (res.ok) {
        setShowEditModal(false);
        setEditingOrder(null);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!isAdmin) {
      alert('Action réservée exclusivement à l\'Administrateur du Tenant.');
      return;
    }
    if (!window.confirm('⚠️ SUPPRESSION DEFINITIVE : Voulez-vous vraiment supprimer cette commande ?')) return;

    try {
      const token = localStorage.getItem('kpsy_token');
      const res = await fetch(`/api/tailleur/measurements/orders/${id}/delete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [garmentType, setGarmentType] = useState('Grand Boubou 3P');
  const [totalAmount, setTotalAmount] = useState(35000);
  const [advancePaid, setAdvancePaid] = useState(15000);
  const [fittingDate, setFittingDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [newStatus, setNewStatus] = useState<TailleurOrder['status']>('ORDERED');
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

  const handlePrintOrder = (o: TailleurOrder) => {
    const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
    const advancePaid = o.advancePaid ?? 0;
    const totalPrice = o.totalPrice ?? o.totalAmount ?? 0;
    setPrintDoc({
      number: o.orderNumber || 'CMD-000',
      date: dateStr,
      clientName: o.clientName || 'Client',
      clientPhone: o.clientPhone,
      items: [
        { description: `Commande Couture : ${o.garmentType || 'Vêtement'} (Avance: ${advancePaid.toLocaleString()} XOF)`, quantity: 1, unitPrice: totalPrice },
      ],
    });
    setShowPrintModal(true);
  };




  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('kpsy_token');
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

      const [resO, resC] = await Promise.all([
        fetch('/api/tailleur/measurements/orders/all', { headers }),
        fetch('/api/tailleur/measurements', { headers }),
      ]);

      if (resO.ok) {
        const dataO = await resO.json();
        setOrders(Array.isArray(dataO) ? dataO : []);
      } else {
        setOrders([]);
      }

      if (resC.ok) {
        const dataC = await resC.json();
        setClients(Array.isArray(dataC) ? dataC : []);
      } else {
        setClients([]);
      }
    } catch (e) {
      console.error(e);
      setOrders([]);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('kpsy_token');
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

      const res = await fetch('/api/tailleur/measurements/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          clientName,
          clientPhone,
          garmentType,
          totalPrice: Number(totalAmount),
          advancePaid: Number(advancePaid),
          fittingDate: fittingDate ? new Date(fittingDate).toISOString() : undefined,
          deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setClientName('');
        setClientPhone('');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('kpsy_token');
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

      const res = await fetch(`/api/tailleur/measurements/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setShowStatusModal(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };


  const getStatusBadge = (status: TailleurOrder['status']) => {
    const config: Record<string, { bg: string; color: string; label: string }> = {
      ORDERED: { bg: '#FEF3C7', color: '#92400E', label: 'Commandé' },
      CUTTING: { bg: '#E0E7FF', color: '#3730A3', label: 'Coupe en cours' },
      SEWING: { bg: '#FCE7F3', color: '#9D174D', label: 'Couture en cours' },
      FITTING: { bg: '#EDE9FE', color: '#5B21B6', label: 'Rdv Essayage' },
      READY: { bg: '#D1FAE5', color: '#065F46', label: 'Prêt à livrer' },
      DELIVERED: { bg: '#F3F4F6', color: '#4B5563', label: 'Livré' },
    };
    const c = config[status] || config.ORDERED;
    return (
      <span style={{ padding: '4px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.75rem', background: c.bg, color: c.color }}>
        {c.label}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: '#111827' }}>
            Commandes de Confection ({orders?.length || 0})
          </h2>

          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
            Suivi des ordres de couture, avances versées et soldes en XOF
          </p>
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
          + Nouvelle Commande (CMD-2026-XXXX)
        </button>
      </div>

      {/* Table Orders */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Chargement des commandes...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <tr>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>N° Commande</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Client</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Modèle / Vêtement</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Statut Atelier</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Avance Perçue</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Solde Restant</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Action</th>

              </tr>
            </thead>
            <tbody>
              {!orders || !Array.isArray(orders) || orders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
                    Aucune commande de couture enregistrée pour le moment.
                  </td>
                </tr>
              ) : (

                orders.map((o) => {
                  const totalPrice = o.totalPrice ?? o.totalAmount ?? 0;
                  const advancePaid = o.advancePaid ?? 0;
                  const remainingAmount = o.remainingAmount ?? Math.max(0, totalPrice - advancePaid);

                  return (
                    <tr key={o.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: themeColor }}>{o.orderNumber}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600 }}>{o.clientName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{o.clientPhone}</div>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 600 }}>{o.garmentType}</td>
                      <td style={{ padding: '14px 18px' }}>{getStatusBadge(o.status)}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#059669' }}>
                        {advancePaid.toLocaleString()} XOF
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 800, color: remainingAmount > 0 ? '#DC2626' : '#059669' }}>
                        {remainingAmount.toLocaleString()} XOF
                      </td>
                      <td style={{ padding: '14px 18px' }}>

                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => {
                              setSelectedOrder(o);
                              setNewStatus(o.status);
                              setShowStatusModal(true);
                            }}
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
                            Statut ⚙️
                          </button>

                          <button
                            onClick={() => handleOpenEdit(o)}
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
                            ✏️ Modifier
                          </button>

                          {o.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleOpenCancel(o)}
                              style={{
                                padding: '5px 9px',
                                borderRadius: 6,
                                border: '1px solid #FCA5A5',
                                background: '#FEF2F2',
                                color: '#991B1B',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              🚫 Annuler
                            </button>
                          )}

                          <button
                            onClick={() => handlePrintOrder(o)}
                            style={{
                              padding: '5px 9px',
                              borderRadius: 6,
                              border: '1px solid #D1D5DB',
                              background: 'white',
                              color: '#374151',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            👁️ / 🖨️ Bon
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteOrder(o.id)}
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
                              title="Suppression réservée à l'Administrateur du Tenant"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}


            </tbody>
          </table>
        )}
      </div>

      {/* Modal Création Commande */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Créer une Commande de Couture">
        <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
              Nom du Client
            </label>
            <input
              required
              placeholder="ex: Aminata DIOP"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
              Téléphone
            </label>
            <input
              required
              placeholder="ex: +221 77 987 65 43"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
              Modèle de Vêtement
            </label>
            <input
              required
              placeholder="ex: Grand Boubou 3P Bazin Getzner"
              value={garmentType}
              onChange={(e) => setGarmentType(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                Prix Total (XOF)
              </label>
              <input
                type="number"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                Avance Perçue (XOF)
              </label>
              <input
                type="number"
                required
                value={advancePaid}
                onChange={(e) => setAdvancePaid(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                Date d'Essayage
              </label>
              <input
                type="date"
                value={fittingDate}
                onChange={(e) => setFittingDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                Date de Livraison
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
              />
            </div>
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
            {submitting ? 'Enregistrement...' : 'Créer la Commande'}
          </button>
        </form>
      </Modal>

      {/* Modal Changement Statut */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Mettre à jour le Statut de l'Atelier">
        <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              Nouveau Statut de Confection
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as any)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB', fontWeight: 600 }}
            >
              <option value="ORDERED">1. Commandé (En attente)</option>
              <option value="CUTTING">2. Coupe en cours</option>
              <option value="SEWING">3. Couture en cours</option>
              <option value="FITTING">4. Rendez-vous Essayage</option>
              <option value="READY">5. Prêt à être livré</option>
              <option value="DELIVERED">6. Livré au client</option>
            </select>
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
            {submitting ? 'Mise à jour...' : 'Enregistrer le Statut'}
          </button>
        </form>
      </Modal>

      {/* Modal Modification Commande */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Modifier la Commande : ${editingOrder?.orderNumber}`}>
        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
              Nom du Client
            </label>
            <input
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
              Téléphone
            </label>
            <input
              required
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
              Modèle de Vêtement
            </label>
            <input
              required
              value={garmentType}
              onChange={(e) => setGarmentType(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                Prix Total (XOF)
              </label>
              <input
                type="number"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                Avance Perçue (XOF)
              </label>
              <input
                type="number"
                required
                value={advancePaid}
                onChange={(e) => setAdvancePaid(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                Date d'Essayage
              </label>
              <input
                type="date"
                value={fittingDate}
                onChange={(e) => setFittingDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                Date de Livraison
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
              />
            </div>
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
            {submitting ? 'Enregistrement...' : 'Enregistrer les Modifications'}
          </button>
        </form>
      </Modal>

      {/* Modal Annulation avec Motif */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title={`Annulation de la Commande : ${selectedOrder?.orderNumber}`}>
        <form onSubmit={handleConfirmCancel} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#FEF2F2', padding: 12, borderRadius: 8, border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '0.8rem', fontWeight: 600 }}>
            ⚠️ Attention : L'annulation de la commande passera son statut en "CANCELLED".
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
              Motif de l'Annulation *
            </label>
            <textarea
              required
              rows={3}
              placeholder="ex: Désistement du client, retard de livraison du tissu par le fournisseur..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #CBD5E1', background: 'white', fontWeight: 600, cursor: 'pointer' }}
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#DC2626', color: 'white', fontWeight: 700, cursor: 'pointer' }}
            >
              {submitting ? 'Traitement...' : 'Confirmer l\'Annulation'}
            </button>
          </div>
        </form>
      </Modal>


      {/* Modal d'Impression du Bon de Commande Couture */}
      <DocumentPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title={`Impression Bon de Commande Couture : ${printDoc.number}`}
        documentType="BON_COMMANDE"
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
