import { StorageService } from '../../services/storage';
import React, { useState, useEffect } from 'react';

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

interface Props {
  themeColor: string;
}

const COLUMNS = [
  { id: 'ORDERED', label: 'À Faire' },
  { id: 'CUTTING', label: 'Coupe' },
  { id: 'SEWING', label: 'Couture' },
  { id: 'FITTING', label: 'Essayage' },
  { id: 'READY', label: 'Terminé / Prêt' },
];

export const TailleurTasksKanban: React.FC<Props> = ({ themeColor }) => {
  const [orders, setOrders] = useState<TailleurOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [draggedOrder, setDraggedOrder] = useState<TailleurOrder | null>(null);

  const currentUser = JSON.parse(localStorage.getItem('kpsy_user') || '{}');
  const isSuperAdmin = currentUser?.roles?.includes('SUPER_ADMIN');
  const isManager = currentUser?.roles?.includes('MANAGER');
  const isAdmin = isSuperAdmin || isManager;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let token;
    StorageService.get("kpsy_token").then(t => token = t);
    // FIXME: token fetch is now async, might break sync logic
      const res = await fetch('/api/tailleur/measurements/orders/all', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const allOrders = Array.isArray(data) ? data : [];
        
        // Si non-admin, on filtre pour ne voir que ses tâches
        if (!isAdmin) {
          setOrders(allOrders.filter((o: TailleurOrder) => o.assigneeId === currentUser.id));
        } else {
          // Si admin, il voit tout pour l'instant (ou on peut lui afficher tous les Kanban)
          setOrders(allOrders);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      let token;
    StorageService.get("kpsy_token").then(t => token = t);
    // FIXME: token fetch is now async, might break sync logic
      const res = await fetch(`/api/tailleur/measurements/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating status', error);
    }
  };

  const onDragStart = (e: React.DragEvent, order: TailleurOrder) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // allow drop
  };

  const onDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (draggedOrder && draggedOrder.status !== colId) {
      updateOrderStatus(draggedOrder.id, colId);
    }
    setDraggedOrder(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', minHeight: 'calc(100vh - 200px)' }}>
      <div>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: 'var(--text-main)' }}>
          {isAdmin ? "Tableau de Bord Kanban (Toutes les tâches)" : "Mes Tâches de Couture"}
        </h2>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Faites glisser les cartes pour mettre à jour l'état d'avancement.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des tâches...</div>
      ) : (
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16, flex: 1 }}>
          {COLUMNS.map((col) => {
            const colOrders = orders.filter(o => o.status === col.id);
            return (
              <div
                key={col.id}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, col.id)}
                style={{
                  minWidth: 280,
                  maxWidth: 280,
                  background: 'var(--bg-card)',
                  borderRadius: 12,
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '100%',
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', background: '#F9FAFB', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {col.label} <span style={{ background: '#E5E7EB', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', marginLeft: 6 }}>{colOrders.length}</span>
                  </h3>
                </div>
                
                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1, minHeight: 150 }}>
                  {colOrders.map(o => (
                    <div
                      key={o.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, o)}
                      style={{
                        background: 'white',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        padding: 12,
                        cursor: 'grab',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: themeColor }}>{o.orderNumber}</span>
                        {o.fittingDate && <span style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: 700 }}>Essayage: {new Date(o.fittingDate).toLocaleDateString()}</span>}
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 4 }}>{o.clientName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>Vêtement: <strong>{o.garmentType}</strong></div>
                      
                      {o.fabricProvided && (
                        <div style={{ fontSize: '0.75rem', background: '#FEF3C7', color: '#92400E', padding: '4px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 8 }}>
                          🧵 Tissu fourni ({o.fabricMeters} m)
                        </div>
                      )}

                      {isAdmin && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border-color)', paddingTop: 8, marginTop: 4 }}>
                          Assigné à : <strong>{o.assignee?.fullName || 'Non assigné'}</strong>
                        </div>
                      )}
                    </div>
                  ))}
                  {colOrders.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '0.8rem', marginTop: 20 }}>
                      Aucune tâche
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
