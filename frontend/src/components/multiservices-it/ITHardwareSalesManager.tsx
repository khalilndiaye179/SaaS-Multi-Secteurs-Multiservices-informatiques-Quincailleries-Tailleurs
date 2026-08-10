import React, { useState } from 'react';
import { Modal } from '../shared/Modal';

interface HardwareItem {
  id: string;
  name: string;
  category: string;
  condition: 'NEW' | 'REFURBISHED' | 'USED';
  priceXOF: number;
  stockQty: number;
  status: 'AVAILABLE' | 'SOLD' | 'CANCELLED';
  cancelReason?: string;
}

interface Props {
  themeColor: string;
}

export const ITHardwareSalesManager: React.FC<Props> = ({ themeColor }) => {
  const user = JSON.parse(localStorage.getItem('kpsy_user') || '{}');
  const isAdmin = !user?.roles || user?.roles?.length === 0 || user?.roles?.includes('TENANT_ADMIN') || user?.roles?.includes('ADMIN_TENANT') || user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN');


  const [items, setItems] = useState<HardwareItem[]>([
    { id: '1', name: 'PC Portable Dell Latitude 5490 i5 8th Gen 8GB/256GB SSD', category: 'Laptops', condition: 'REFURBISHED', priceXOF: 185000, stockQty: 3, status: 'AVAILABLE' },
    { id: '2', name: 'Chargeur Universel Laptop 90W Multi-Embouts', category: 'Accessoires', condition: 'NEW', priceXOF: 15000, stockQty: 12, status: 'AVAILABLE' },
    { id: '3', name: 'Écran Ecran 24" Dell Full HD HDMI/VGA', category: 'Moniteurs', condition: 'USED', priceXOF: 45000, stockQty: 2, status: 'AVAILABLE' },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Laptops');
  const [condition, setCondition] = useState<HardwareItem['condition']>('NEW');
  const [priceXOF, setPriceXOF] = useState(150000);
  const [stockQty, setStockQty] = useState(1);
  const [cancelReason, setCancelReason] = useState('');

  const handleOpenAdd = () => {
    setSelectedId(null);
    setName('');
    setCategory('Laptops');
    setCondition('NEW');
    setPriceXOF(150000);
    setStockQty(1);
    setShowModal(true);
  };

  const handleOpenEdit = (h: HardwareItem) => {
    setSelectedId(h.id);
    setName(h.name);
    setCategory(h.category);
    setCondition(h.condition);
    setPriceXOF(h.priceXOF);
    setStockQty(h.stockQty);
    setShowModal(true);
  };

  const handleOpenCancel = (id: string) => {
    if (!isAdmin) {
      alert('Seul un Administrateur peut annuler une vente ou un matériel.');
      return;
    }
    setSelectedId(id);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedId) {
      setItems(items.map((h) => (h.id === selectedId ? { ...h, name, category, condition, priceXOF, stockQty } : h)));
    } else {
      const newItem: HardwareItem = {
        id: Date.now().toString(),
        name,
        category,
        condition,
        priceXOF,
        stockQty,
        status: 'AVAILABLE',
      };
      setItems([...items, newItem]);
    }
    setShowModal(false);
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setItems(items.map((h) => (h.id === selectedId ? { ...h, status: 'CANCELLED', cancelReason } : h)));
    setShowCancelModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: '#111827' }}>
            Vente & Achat de Matériel Informatique ({items.length})
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
            Gestion des équipements d'occasion, accessoires neufs et reconditionnement
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
          + Enregistrer un Matériel / Vente
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
            <tr>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Désignation Équipement</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Catégorie</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>État</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Prix Unitaire (XOF)</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Quantité Stock</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Statut</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((h) => (
              <tr key={h.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '14px 18px', fontWeight: 700 }}>{h.name}</td>
                <td style={{ padding: '14px 18px', color: '#6B7280' }}>{h.category}</td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, background: h.condition === 'NEW' ? '#D1FAE5' : '#FEF3C7', color: h.condition === 'NEW' ? '#065F46' : '#92400E' }}>
                    {h.condition}
                  </span>
                </td>
                <td style={{ padding: '14px 18px', fontWeight: 800, color: themeColor }}>
                  {h.priceXOF.toLocaleString()} XOF
                </td>
                <td style={{ padding: '14px 18px', fontWeight: 700 }}>{h.stockQty} dispo</td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: h.status === 'AVAILABLE' ? '#D1FAE5' : '#FEE2E2', color: h.status === 'AVAILABLE' ? '#065F46' : '#DC2626' }}>
                    {h.status === 'CANCELLED' ? `Annulé (${h.cancelReason || 'Client désisté'})` : h.status}
                  </span>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleOpenEdit(h)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #CBD5E1', background: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                      ✏️ Edit
                    </button>
                    {isAdmin && h.status !== 'CANCELLED' && (
                      <button onClick={() => handleOpenCancel(h.id)} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#FEE2E2', color: '#DC2626', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                        🚫 Annulation + Motif
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Ajout / Modif */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={selectedId ? 'Modifier le Matériel' : 'Enregistrer un Matériel'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Désignation</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: PC Lenovo ThinkPad T480" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Catégorie</label>
              <input required value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>État</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value as any)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB' }}>
                <option value="NEW">Neuf</option>
                <option value="REFURBISHED">Reconditionné</option>
                <option value="USED">Occasion</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Prix de Vente (XOF)</label>
              <input type="number" required value={priceXOF} onChange={(e) => setPriceXOF(Number(e.target.value))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Quantité Stock</label>
              <input type="number" required value={stockQty} onChange={(e) => setStockQty(Number(e.target.value))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB' }} />
            </div>
          </div>

          <button type="submit" style={{ padding: 12, borderRadius: 8, border: 'none', background: themeColor, color: 'white', fontWeight: 800, cursor: 'pointer', marginTop: 10 }}>
            Enregistrer Matériel ✓
          </button>
        </form>
      </Modal>

      {/* Modal Annulation avec Motif (Admin Only) */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Annulation d'une Vente / Matériel (Admin Only)">
        <form onSubmit={handleConfirmCancel} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Motif d'Annulation Obligatoire</label>
            <textarea required rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="ex: Erreur de saisie, client s'est désisté à la caisse..." style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB' }} />
          </div>

          <button type="submit" style={{ padding: 12, borderRadius: 8, border: 'none', background: '#DC2626', color: 'white', fontWeight: 800, cursor: 'pointer' }}>
            Confirmer l'Annulation 🚫
          </button>
        </form>
      </Modal>
    </div>
  );
};
