import { StorageService } from '../../services/storage';
import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';

export interface PurchaseOrder {
  id: string;
  supplierName: string;
  itemDescription: string;
  stockItemId?: string | null;
  qtyOrdered: number;
  totalCostXOF: number;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  notes?: string | null;
  orderDate?: string;
  receivedDate?: string | null;
}

interface Props {
  themeColor: string;
}

export const QuincailleriePurchasesManager: React.FC<Props> = ({ themeColor }) => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([
    {
      id: '1',
      supplierName: 'SOCOCIM Industries Sénégal',
      itemDescription: 'Ciment SOCOCIM 50kg (Palette 40 sacs)',
      qtyOrdered: 120,
      totalCostXOF: 360000,
      status: 'RECEIVED',
      notes: 'Livraison complète effectuée au dépôt principal',
      orderDate: '2026-08-01',
      receivedDate: '2026-08-03',
    },
    {
      id: '2',
      supplierName: 'Quincaillerie Générale de Rufisque',
      itemDescription: 'Fer à Béton 12mm (Bottes 500kg)',
      qtyOrdered: 10,
      totalCostXOF: 450000,
      status: 'PENDING',
      notes: 'Acompte de 50% versé. Attente bon de livraison usine.',
      orderDate: '2026-08-10',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    supplierName: '',
    itemDescription: '',
    qtyOrdered: 1,
    totalCostXOF: 0,
    status: 'PENDING' as 'PENDING' | 'RECEIVED' | 'CANCELLED',
    notes: '',
  });

  // Fetch orders from API (with fallback to state)
  const fetchOrders = async () => {
    try {
      setLoading(true);
      let token;
    StorageService.get("kpsy_token").then(t => token = t);
    // FIXME: token fetch is now async, might break sync logic
      const res = await fetch('/api/quincaillerie/purchases', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setOrders(data);
        }
      }
    } catch (err) {
      console.warn('API non disponible, utilisation des données locales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      supplierName: '',
      itemDescription: '',
      qtyOrdered: 1,
      totalCostXOF: 0,
      status: 'PENDING',
      notes: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setFormData({
      supplierName: order.supplierName,
      itemDescription: order.itemDescription,
      qtyOrdered: order.qtyOrdered,
      totalCostXOF: order.totalCostXOF,
      status: order.status,
      notes: order.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenView = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let token;
    StorageService.get("kpsy_token").then(t => token = t);
    // FIXME: token fetch is now async, might break sync logic

    const newOrder: PurchaseOrder = {
      id: Date.now().toString(),
      ...formData,
      orderDate: new Date().toISOString().split('T')[0],
    };

    try {
      const res = await fetch('/api/quincaillerie/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const created = await res.json();
        setOrders([created, ...orders]);
      } else {
        setOrders([newOrder, ...orders]);
      }
    } catch (err) {
      setOrders([newOrder, ...orders]);
    }

    setIsCreateModalOpen(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    let token;
    StorageService.get("kpsy_token").then(t => token = t);
    // FIXME: token fetch is now async, might break sync logic
    const updatedData = { ...formData };

    try {
      const res = await fetch(`/api/quincaillerie/purchases/${selectedOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (res.ok) {
        const updated = await res.json();
        setOrders(orders.map((o) => (o.id === selectedOrder.id ? updated : o)));
      } else {
        setOrders(orders.map((o) => (o.id === selectedOrder.id ? { ...o, ...updatedData } : o)));
      }
    } catch (err) {
      setOrders(orders.map((o) => (o.id === selectedOrder.id ? { ...o, ...updatedData } : o)));
    }

    setIsEditModalOpen(false);
  };

  const handleMarkAsReceived = async (id: string) => {
    if (!window.confirm('Confirmer la réception de cette commande ? Le stock sera mis à jour s’il y a un article lié.')) return;

    let token;
    StorageService.get("kpsy_token").then(t => token = t);
    // FIXME: token fetch is now async, might break sync logic
    try {
      const res = await fetch(`/api/quincaillerie/purchases/${id}/receive`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const updated = await res.json();
        setOrders(orders.map((o) => (o.id === id ? updated : o)));
      } else {
        setOrders(
          orders.map((o) =>
            o.id === id ? { ...o, status: 'RECEIVED', receivedDate: new Date().toISOString().split('T')[0] } : o
          )
        );
      }
    } catch (err) {
      setOrders(
        orders.map((o) =>
          o.id === id ? { ...o, status: 'RECEIVED', receivedDate: new Date().toISOString().split('T')[0] } : o
        )
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette commande fournisseur ?')) return;

    let token;
    StorageService.get("kpsy_token").then(t => token = t);
    // FIXME: token fetch is now async, might break sync logic
    try {
      await fetch(`/api/quincaillerie/purchases/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.warn('API non disponible, suppression locale');
    }

    setOrders(orders.filter((o) => o.id !== id));
  };

  const totalPurchasesXOF = orders.reduce((sum, o) => sum + o.totalCostXOF, 0);
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const receivedCount = orders.filter((o) => o.status === 'RECEIVED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header & Main Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: 'var(--text-main)' }}>
            Achats & Commandes Fournisseurs
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Gestion centralisée des approvisionnements, usines & réassorts grossistes
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          style={{
            background: themeColor,
            color: 'var(--text-inverse)',
            border: 'none',
            borderRadius: 10,
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>+</span> Nouvelle Commande
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 12, border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Volume Total Achats</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>
            {totalPurchasesXOF.toLocaleString()} XOF
          </div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 12, border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>En Attente Usine</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#D97706', marginTop: 4 }}>
            {pendingCount} commandes
          </div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 12, border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Réceptionnés au Stock</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
            {receivedCount} livraisons
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des commandes...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Aucune commande fournisseur enregistrée.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Fournisseur</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Désignation / Matériau</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Quantité</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Coût Total</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Statut</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 700 }}>{o.supplierName}</td>
                  <td style={{ padding: '14px 18px' }}>{o.itemDescription}</td>
                  <td style={{ padding: '14px 18px', fontWeight: 700 }}>{o.qtyOrdered} unités</td>
                  <td style={{ padding: '14px 18px', fontWeight: 800, color: themeColor }}>
                    {o.totalCostXOF.toLocaleString()} XOF
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        background: o.status === 'RECEIVED' ? '#D1FAE5' : o.status === 'CANCELLED' ? '#FEE2E2' : '#FEF3C7',
                        color: o.status === 'RECEIVED' ? '#065F46' : o.status === 'CANCELLED' ? '#991B1B' : '#92400E',
                      }}
                    >
                      {o.status === 'RECEIVED' ? 'Livré au Stock' : o.status === 'CANCELLED' ? 'Annulé' : 'En attente usine'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      <button
                        onClick={() => handleOpenView(o)}
                        title="Voir détails"
                        style={{
                          background: 'var(--bg-main)',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                        }}
                      >
                        👁️ Voir
                      </button>

                      {o.status === 'PENDING' && (
                        <button
                          onClick={() => handleMarkAsReceived(o.id)}
                          title="Réceptionner au stock"
                          style={{
                            background: '#D1FAE5',
                            border: 'none',
                            borderRadius: 6,
                            padding: '6px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            color: '#065F46',
                          }}
                        >
                          📦 Réceptionner
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEdit(o)}
                        title="Modifier"
                        style={{
                          background: '#EFF6FF',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          color: '#1D4ED8',
                        }}
                      >
                        ✏️ Éditer
                      </button>

                      <button
                        onClick={() => handleDelete(o.id)}
                        title="Supprimer"
                        style={{
                          background: '#FEE2E2',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          color: '#991B1B',
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Création */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Nouvelle Commande Fournisseur">
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>Nom du Fournisseur *</label>
            <input
              type="text"
              required
              placeholder="ex: SOCOCIM, Les Ciments du Sahel, Grossiste Rufisque..."
              value={formData.supplierName}
              onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.88rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>Désignation / Matériau *</label>
            <input
              type="text"
              required
              placeholder="ex: Fer à béton 10mm, Ciment 50kg, Tuyau PVC 110..."
              value={formData.itemDescription}
              onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.88rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>Quantité *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.qtyOrdered}
                onChange={(e) => setFormData({ ...formData, qtyOrdered: parseInt(e.target.value) || 1 })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.88rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>Coût Total (XOF) *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.totalCostXOF}
                onChange={(e) => setFormData({ ...formData, totalCostXOF: parseFloat(e.target.value) || 0 })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>Statut initial</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.88rem' }}
            >
              <option value="PENDING">En attente usine / livraison</option>
              <option value="RECEIVED">Déjà réceptionné au stock</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>Notes / Modalités de paiement</label>
            <textarea
              rows={3}
              placeholder="ex: Acompte 50% payé à la commande, solde à la livraison..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.88rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: themeColor, color: 'var(--text-inverse)', fontWeight: 700, cursor: 'pointer' }}
            >
              Enregistrer la Commande
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Édition */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modifier la Commande Fournisseur">
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>Nom du Fournisseur *</label>
            <input
              type="text"
              required
              value={formData.supplierName}
              onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.88rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>Désignation / Matériau *</label>
            <input
              type="text"
              required
              value={formData.itemDescription}
              onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.88rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>Quantité *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.qtyOrdered}
                onChange={(e) => setFormData({ ...formData, qtyOrdered: parseInt(e.target.value) || 1 })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.88rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>Coût Total (XOF) *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.totalCostXOF}
                onChange={(e) => setFormData({ ...formData, totalCostXOF: parseFloat(e.target.value) || 0 })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>Statut</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.88rem' }}
            >
              <option value="PENDING">En attente usine / livraison</option>
              <option value="RECEIVED">Livré au Stock</option>
              <option value="CANCELLED">Commande Annulée</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.88rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: themeColor, color: 'var(--text-inverse)', fontWeight: 700, cursor: 'pointer' }}
            >
              Mettre à jour
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Visualisation */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Détails de la Commande">
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'var(--bg-main)', padding: 14, borderRadius: 10, border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Fournisseur</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>{selectedOrder.supplierName}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Matériau / Désignation</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{selectedOrder.itemDescription}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Quantité Commandée</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{selectedOrder.qtyOrdered} unités</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Coût Total</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: themeColor }}>{selectedOrder.totalCostXOF.toLocaleString()} XOF</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Statut</span>
                <div>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      background: selectedOrder.status === 'RECEIVED' ? '#D1FAE5' : selectedOrder.status === 'CANCELLED' ? '#FEE2E2' : '#FEF3C7',
                      color: selectedOrder.status === 'RECEIVED' ? '#065F46' : selectedOrder.status === 'CANCELLED' ? '#991B1B' : '#92400E',
                    }}
                  >
                    {selectedOrder.status === 'RECEIVED' ? 'Livré au Stock' : selectedOrder.status === 'CANCELLED' ? 'Annulé' : 'En attente usine'}
                  </span>
                </div>
              </div>
            </div>

            {selectedOrder.notes && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Notes & Modalités</span>
                <div style={{ background: '#FFFBEB', padding: 12, borderRadius: 8, fontSize: '0.85rem', color: '#92400E', marginTop: 4 }}>
                  {selectedOrder.notes}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button
                onClick={() => setIsViewModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', fontWeight: 700, cursor: 'pointer' }}
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
