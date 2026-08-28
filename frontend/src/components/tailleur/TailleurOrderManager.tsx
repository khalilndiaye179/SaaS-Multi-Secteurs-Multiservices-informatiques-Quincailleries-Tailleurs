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
  status: 'ORDERED' | 'CUTTING' | 'SEWING' | 'FITTING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  fittingDate?: string;
  deliveryDate?: string;
  createdAt: string;
  fabricProvided?: boolean;
  fabricMeters?: number;
  assigneeId?: string;
  assignee?: { id: string; fullName: string };
}
interface ClientMeasurement {
  id: string;
  clientName: string;
  clientPhone: string;
}

const CATALOG_MODELS = [
  { name: 'Grand Boubou 3P Bazin', price: 35000 },
  { name: 'Taille Basse Bazin Brodé', price: 25000 },
  { name: 'Costume 2 Pièces Homme', price: 45000 },
  { name: 'Robe de Mariée / Cérémonie', price: 85000 },
  { name: 'Ensemble Enfant Traditionnel', price: 15000 },
  { name: 'Tunique & Pantalon Simple', price: 20000 },
];

interface Props {
  themeColor: string;
}

export const TailleurOrderManager: React.FC<Props> = ({ themeColor }) => {
  const [orders, setOrders] = useState<TailleurOrder[]>([]);
  const [clients, setClients] = useState<ClientMeasurement[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<TailleurOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);


  // Form New Order
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [fabricProvided, setFabricProvided] = useState(false);
  const [fabricMeters, setFabricMeters] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

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
    setFabricProvided(o.fabricProvided ?? false);
    setFabricMeters(o.fabricMeters ? o.fabricMeters.toString() : '');
    setAssigneeId(o.assigneeId || '');

    const foundInCatalog = CATALOG_MODELS.some((m) => m.name === o.garmentType);
    if (foundInCatalog) {
      const catObj = CATALOG_MODELS.find((m) => m.name === o.garmentType)!;
      setOrderItems([{ catalogName: catObj.name, customName: '', price: o.totalPrice ?? catObj.price }]);
    } else {
      setOrderItems([{ catalogName: 'CUSTOM', customName: o.garmentType || '', price: o.totalPrice ?? 35000 }]);
    }

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
      const combinedGarmentType = orderItems
        .map((it) => (it.catalogName === 'CUSTOM' ? it.customName || 'Vêtement Sur-Mesure' : it.catalogName))
        .filter(Boolean)
        .join(' + ');

      const res = await fetch(`/api/tailleur/measurements/orders/${editingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          clientName,
          clientPhone,
          garmentType: combinedGarmentType || garmentType,
          totalPrice: Number(totalAmount),
          advancePaid: Number(advancePaid),
          fittingDate: fittingDate ? new Date(fittingDate).toISOString() : undefined,
          deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
          fabricProvided,
          fabricMeters: fabricMeters ? Number(fabricMeters) : undefined,
          assigneeId: assigneeId || undefined,
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

  // Modèles du Catalogue Atelier


  // Gestion Multi-articles / Multi-modèles dans la même commande
  const [orderItems, setOrderItems] = useState<Array<{ catalogName: string; customName: string; price: number }>>([
    { catalogName: '', customName: '', price: 0 },
  ]);

  const recalculateTotal = (items: Array<{ catalogName: string; customName: string; price: number }>) => {
    const sum = items.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
    setTotalAmount(sum);
  };

  const handleAddItem = () => {
    const defaultModel = CATALOG_MODELS[0];
    const newItems = [...orderItems, { catalogName: defaultModel.name, customName: '', price: defaultModel.price }];
    setOrderItems(newItems);
    recalculateTotal(newItems);
  };

  const handleRemoveItem = (index: number) => {
    if (orderItems.length <= 1) return;
    const newItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(newItems);
    recalculateTotal(newItems);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...orderItems];
    const item = { ...newItems[index], [field]: value };

    if (field === 'catalogName') {
      if (value === 'CUSTOM') {
        item.price = item.price || 20000;
      } else {
        const found = CATALOG_MODELS.find((m) => m.name === value);
        if (found) {
          item.price = found.price;
        }
      }
    }

    newItems[index] = item;
    setOrderItems(newItems);
    recalculateTotal(newItems);
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

  const handleRegisterPayment = async (orderId: string, totalPrice: number, advancePaid: number) => {
    const solde = totalPrice - advancePaid;
    const input = window.prompt(`Solde restant : ${solde.toLocaleString()} XOF\nMontant du paiement à enregistrer :`);
    if (!input) return;
    const amount = Number(input);
    if (isNaN(amount) || amount <= 0) {
      alert('Montant invalide.');
      return;
    }
    try {
      const token = localStorage.getItem('kpsy_token');
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const res = await fetch(`/api/tailleur/measurements/orders/${orderId}/payment`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.message || "Erreur lors de l'enregistrement du paiement.");
        return;
      }
      fetchData();
    } catch (e) {
      alert('Erreur réseau.');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('kpsy_token');
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

      const [resO, resC, resCollab] = await Promise.all([
        fetch('/api/tailleur/measurements/orders/all', { headers }),
        fetch('/api/tailleur/measurements', { headers }),
        fetch('/api/tailleur/measurements/collaborators', { headers }),
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

      if (resCollab.ok) {
        const dataCol = await resCollab.json();
        setCollaborators(Array.isArray(dataCol) ? dataCol : []);
      } else {
        setCollaborators([]);
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

      const combinedGarmentType = orderItems
        .map((it) => (it.catalogName === 'CUSTOM' ? it.customName || 'Vêtement Sur-Mesure' : it.catalogName))
        .filter(Boolean)
        .join(' + ');

      const itemsPayload = orderItems.map((it) => ({
        garmentType: it.catalogName === 'CUSTOM' ? it.customName || 'Vêtement Sur-Mesure' : it.catalogName,
        unitPrice: Number(it.price) || 0,
        quantity: 1,
      }));

      const res = await fetch('/api/tailleur/measurements/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          clientName,
          clientPhone,
          garmentType: combinedGarmentType || garmentType,
          items: itemsPayload,
          totalPrice: Number(totalAmount),
          advancePaid: Number(advancePaid),
          fittingDate: fittingDate ? new Date(fittingDate).toISOString() : undefined,
          deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
          fabricProvided,
          fabricMeters: fabricMeters ? Number(fabricMeters) : undefined,
          assigneeId: assigneeId || undefined,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setClientName('');
        setClientPhone('');
        setOrderItems([{ catalogName: CATALOG_MODELS[0].name, customName: '', price: CATALOG_MODELS[0].price }]);
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
      DELIVERED: { bg: '#F3F4F6', color: 'var(--text-muted)', label: 'Livré' },
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
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: 'var(--text-main)' }}>
            Commandes de Confection ({orders?.length || 0})
          </h2>

          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Suivi des ordres de couture, avances versées et soldes en XOF
          </p>
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
          + Nouvelle Commande (CMD-2026-XXXX)
        </button>
      </div>

      {/* Table Orders */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des commandes...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>N° Commande</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Client</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Modèle / Vêtement</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Statut Atelier</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Assigné à</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Avance Perçue</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Solde Restant</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Action</th>

              </tr>
            </thead>
            <tbody>
              {!orders || !Array.isArray(orders) || orders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
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
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.clientPhone}</div>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 600 }}>{o.garmentType}</td>
                      <td style={{ padding: '14px 18px' }}>{getStatusBadge(o.status)}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {o.assignee?.fullName || '—'}
                      </td>
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
                              color: 'var(--text-inverse)',
                              border: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Statut ⚙️
                          </button>

                          {(o.totalPrice ?? o.totalAmount ?? 0) > (o.advancePaid ?? 0) && (
                            <button
                              onClick={() => handleRegisterPayment(o.id, o.totalPrice ?? o.totalAmount ?? 0, o.advancePaid ?? 0)}
                              style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#059669', color: 'var(--text-inverse)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              💰 Paiement
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(o)}
                            style={{
                              padding: '5px 9px',
                              borderRadius: 6,
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-card)',
                              color: 'var(--text-main)',
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
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-card)',
                              color: 'var(--text-muted)',
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Créer une Commande de Couture (Catalogue & Multi-Modèles)">
        <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
              Nom du Client
            </label>
            <input
              required
              placeholder="ex: Aminata DIOP"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
              Téléphone
            </label>
            <input
              required
              placeholder="ex: +221 77 987 65 43"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
            />
          </div>

          {/* Section Modèles de Vêtements (Catalogue + Multi-Items) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0 }}>
              Modèle de Vêtement (Choix dans le Catalogue Atelier)
            </label>

            {orderItems.map((item, idx) => (
              <div key={idx} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: 10, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: themeColor }}>
                    👗 Article #{idx + 1}
                  </span>
                  {orderItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 700 }}
                    >
                      ✕ Retirer
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: item.catalogName === 'CUSTOM' ? '1fr 1fr 100px' : '1fr 100px', gap: 6 }}>
                  <select
                    value={item.catalogName}
                    onChange={(e) => handleItemChange(idx, 'catalogName', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    {CATALOG_MODELS.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name} ({m.price.toLocaleString()} XOF)
                      </option>
                    ))}
                    <option value="CUSTOM">✏️ Autre / Modèle sur-mesure...</option>
                  </select>

                  {item.catalogName === 'CUSTOM' && (
                    <input
                      type="text"
                      required
                      placeholder="Nom du modèle personnalisé..."
                      value={item.customName}
                      onChange={(e) => handleItemChange(idx, 'customName', e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                    />
                  )}

                  <div>
                    <input
                      type="number"
                      required
                      placeholder="Prix XOF"
                      value={item.price}
                      onChange={(e) => handleItemChange(idx, 'price', Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 700 }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Bouton + juste en bas du modèle de vêtement */}
            <button
              type="button"
              onClick={handleAddItem}
              style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 8,
                border: `1.5px dashed ${themeColor}`,
                background: '#F3E8FF',
                color: themeColor,
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                marginTop: 2,
              }}
            >
              ➕ Ajouter un autre modèle à cette commande
            </button>
          </div>

          {/* Section Apport Client & Assignation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#F9FAFB', padding: 12, borderRadius: 8, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={fabricProvided}
                  onChange={(e) => setFabricProvided(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: themeColor }}
                />
                Tissu fourni par le client
              </label>
              {fabricProvided && (
                <input
                  type="number"
                  placeholder="Métrage (ex: 3.5)"
                  step="0.1"
                  value={fabricMeters}
                  onChange={(e) => setFabricMeters(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Assigner à un Collaborateur
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
              >
                <option value="">-- Non assigné --</option>
                {collaborators.map(c => (
                  <option key={c.id} value={c.id}>{c.fullName} ({c.username})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                Prix Total (XOF)
              </label>
              <input
                type="number"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                Avance Perçue (XOF)
              </label>
              <input
                type="number"
                required
                value={advancePaid}
                onChange={(e) => setAdvancePaid(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                Date d'Essayage
              </label>
              <input
                type="date"
                value={fittingDate}
                onChange={(e) => setFittingDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                Date de Livraison
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
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
              color: 'var(--text-inverse)',
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
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>
              Nouveau Statut de Confection
            </label>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'relative', padding: '0 10px' }}>
              <div style={{ position: 'absolute', top: 16, left: 30, right: 30, height: 3, background: '#E5E7EB', zIndex: 0 }} />
              {[
                { value: 'ORDERED', label: 'Commandé' },
                { value: 'CUTTING', label: 'Coupe' },
                { value: 'SEWING', label: 'Couture' },
                { value: 'FITTING', label: 'Essayage' },
                { value: 'READY', label: 'Prêt' },
                { value: 'DELIVERED', label: 'Livré' },
              ].map((s, idx, arr) => {
                const currentIndex = arr.findIndex(x => x.value === newStatus);
                const isCurrent = s.value === newStatus;
                const isPast = currentIndex > idx;
                
                return (
                  <div key={s.value} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, gap: 8, cursor: 'pointer', width: 60 }} onClick={() => setNewStatus(s.value as any)}>
                    <div style={{ 
                      width: 34, height: 34, borderRadius: 17, 
                      background: isCurrent ? themeColor : isPast ? '#10B981' : 'white',
                      border: `2px solid ${isCurrent ? themeColor : isPast ? '#10B981' : '#D1D5DB'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isCurrent || isPast ? 'white' : '#6B7280',
                      fontWeight: 800, fontSize: '0.85rem',
                      transition: 'all 0.2s',
                      boxShadow: isCurrent ? `0 0 0 4px ${themeColor}20` : 'none'
                    }}>
                      {isPast ? '✓' : idx + 1}
                    </div>
                    <div style={{ fontSize: '0.68rem', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? themeColor : isPast ? '#10B981' : '#6B7280', textAlign: 'center', lineHeight: 1.2 }}>
                      {s.label}
                    </div>
                  </div>
                );
              })}
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
              color: 'var(--text-inverse)',
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
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
              Nom du Client
            </label>
            <input
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
              Téléphone
            </label>
            <input
              required
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
            />
          </div>

          {/* Section Modèles de Vêtements (Catalogue + Multi-Items) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0 }}>
              Modèle de Vêtement (Choix dans le Catalogue Atelier)
            </label>

            {orderItems.map((item, idx) => (
              <div key={idx} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: 10, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: themeColor }}>
                    👗 Article #{idx + 1}
                  </span>
                  {orderItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 700 }}
                    >
                      ✕ Retirer
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: item.catalogName === 'CUSTOM' ? '1fr 1fr 100px' : '1fr 100px', gap: 6 }}>
                  <select
                    value={item.catalogName}
                    onChange={(e) => handleItemChange(idx, 'catalogName', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    {CATALOG_MODELS.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name} ({m.price.toLocaleString()} XOF)
                      </option>
                    ))}
                    <option value="CUSTOM">✏️ Autre / Modèle sur-mesure...</option>
                  </select>

                  {item.catalogName === 'CUSTOM' && (
                    <input
                      type="text"
                      required
                      placeholder="Nom du modèle personnalisé..."
                      value={item.customName}
                      onChange={(e) => handleItemChange(idx, 'customName', e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                    />
                  )}

                  <div>
                    <input
                      type="number"
                      required
                      placeholder="Prix XOF"
                      value={item.price}
                      onChange={(e) => handleItemChange(idx, 'price', Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 700 }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Bouton + juste en bas du modèle de vêtement */}
            <button
              type="button"
              onClick={handleAddItem}
              style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 8,
                border: `1.5px dashed ${themeColor}`,
                background: '#F3E8FF',
                color: themeColor,
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                marginTop: 2,
              }}
            >
              ➕ Ajouter un autre modèle à cette commande
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                Prix Total (XOF)
              </label>
              <input
                type="number"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                Avance Perçue (XOF)
              </label>
              <input
                type="number"
                required
                value={advancePaid}
                onChange={(e) => setAdvancePaid(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                Date d'Essayage
              </label>
              <input
                type="date"
                value={fittingDate}
                onChange={(e) => setFittingDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                Date de Livraison
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
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
              color: 'var(--text-inverse)',
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
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
              Motif de l'Annulation *
            </label>
            <textarea
              required
              rows={3}
              placeholder="ex: Désistement du client, retard de livraison du tissu par le fournisseur..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', fontWeight: 600, cursor: 'pointer' }}
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#DC2626', color: 'var(--text-inverse)', fontWeight: 700, cursor: 'pointer' }}
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
