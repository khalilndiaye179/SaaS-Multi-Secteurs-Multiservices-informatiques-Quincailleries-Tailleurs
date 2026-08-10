import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';

interface StockItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  alertThreshold: number;
}

interface Props {
  themeColor: string;
  onStockUpdated: () => void;
}

export const QuincaillerieStockManager: React.FC<Props> = ({ themeColor, onStockUpdated }) => {
  const token = localStorage.getItem('kpsy_token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);



  // Form New Article
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('sac');
  const [purchasePrice, setPurchasePrice] = useState(3000);
  const [sellingPrice, setSellingPrice] = useState(4500);
  const [quantity, setQuantity] = useState(50);
  const [alertThreshold, setAlertThreshold] = useState(10);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const handleOpenEditModal = (item: StockItem) => {
    setEditingItemId(item.id);
    setName(item.name);
    setSku(item.sku);
    setUnit(item.unit);
    setPurchasePrice(item.purchasePrice);
    setSellingPrice(item.sellingPrice);
    setQuantity(item.quantity);
    setAlertThreshold(item.alertThreshold);
    setShowModal(true);
  };

  const handleDeleteArticle = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet article de l\'inventaire ?')) return;
    try {
      const res = await fetch(`/api/quincaillerie/stock/${id}`, { method: 'DELETE', headers });
      if (res.ok) fetchStock();
    } catch (e) {
      console.error(e);
    }
  };


  const fetchStock = async () => {

    setLoading(true);
    try {
      const res = await fetch('/api/quincaillerie/stock', { headers });
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
        if (onStockUpdated) onStockUpdated();
      } else {
        setItems([]);
      }
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchStock();
  }, []);

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/quincaillerie/stock', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name,
          sku,
          unit,
          purchasePrice,
          sellingPrice,
          quantity,
          alertThreshold,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setName('');
        setSku('');
        fetchStock();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: '#111827' }}>
            Inventaire & Stock Quincaillerie ({items.length})
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
            Gestion des matériaux, quincaillerie lourde/légère et alerte de stock bas
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
          + Ajouter un Article
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Chargement du stock...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <tr>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Désignation Article</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>SKU / Code</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Prix d'Achat</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Prix de Vente</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Quantité Stock</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Seuil Alerte</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!Array.isArray(items) || items.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
                    Aucun article en stock pour le moment.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item?.id || Math.random()} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700 }}>{item?.name || 'Article'}</td>
                    <td style={{ padding: '14px 18px', color: '#6B7280' }}>{item?.sku || '—'}</td>
                    <td style={{ padding: '14px 18px' }}>{item?.purchasePrice ? Number(item.purchasePrice).toLocaleString() : 0} XOF</td>
                    <td style={{ padding: '14px 18px', fontWeight: 800, color: themeColor }}>
                      {item?.sellingPrice ? Number(item.sellingPrice).toLocaleString() : 0} XOF
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          background: (item?.quantity || 0) <= (item?.alertThreshold || 0) ? '#FEE2E2' : '#E0E7FF',
                          color: (item?.quantity || 0) <= (item?.alertThreshold || 0) ? '#DC2626' : '#3730A3',
                        }}
                      >
                        {item?.quantity || 0} {item?.unit || 'unité'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#9CA3AF' }}>&le; {item?.alertThreshold || 0} {item?.unit || 'unité'}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #D1D5DB', background: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(item.id)}
                          style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#FEE2E2', color: '#DC2626', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Ajouter un Article au Stock">
        <form onSubmit={handleCreateArticle} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
              Désignation de l'Article
            </label>
            <input
              required
              placeholder="ex: Ciment SOCOCIM 50kg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                SKU / Référence
              </label>
              <input
                required
                placeholder="ex: CIM-SOC-50"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                Unité de Vente
              </label>
              <input
                required
                placeholder="ex: sac, kg, pièce"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                Prix d'Achat (XOF)
              </label>
              <input
                type="number"
                required
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                Prix de Vente (XOF)
              </label>
              <input
                type="number"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                Quantité Initiale
              </label>
              <input
                type="number"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                Seuil Alerte
              </label>
              <input
                type="number"
                required
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(Number(e.target.value))}
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
            {submitting ? 'Enregistrement...' : 'Enregistrer au Stock'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
