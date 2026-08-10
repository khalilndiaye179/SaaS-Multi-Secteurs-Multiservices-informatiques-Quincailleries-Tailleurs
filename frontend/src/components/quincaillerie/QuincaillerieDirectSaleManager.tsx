import React, { useState, useEffect } from 'react';

interface StockItem {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  quantity: number;
  unit: string;
}

interface SaleLine {
  stockItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface Props {
  themeColor: string;
  onSaleCompleted: () => void;
}

export const QuincaillerieDirectSaleManager: React.FC<Props> = ({ themeColor, onSaleCompleted }) => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [cart, setCart] = useState<SaleLine[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [qtyToSell, setQtyToSell] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const token = localStorage.getItem('kpsy_token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchStock = async () => {
    try {
      const res = await fetch('/api/quincaillerie/stock', { headers });
      if (res.ok) {
        const data = await res.json();
        setStockItems(data);
        if (data.length > 0) setSelectedItemId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleAddToCart = () => {
    const item = stockItems.find((i) => i.id === selectedItemId);
    if (!item) return;

    const existingIdx = cart.findIndex((c) => c.stockItemId === item.id);
    if (existingIdx >= 0) {
      const updated = [...cart];
      updated[existingIdx].quantity += qtyToSell;
      setCart(updated);
    } else {
      setCart([...cart, { stockItemId: item.id, name: item.name, quantity: qtyToSell, unitPrice: item.sellingPrice }]);
    }
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const totalCart = () => cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleValidateSale = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/quincaillerie/stock/sales', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: cart.map((c) => ({ stockItemId: c.stockItemId, quantity: c.quantity, unitPrice: c.unitPrice })),
        }),
      });

      if (res.ok) {
        setCart([]);
        setSuccessMsg('Vente enregistrée avec succès ! Le stock a été décrémenté.');
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchStock();
        onSaleCompleted();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: '#111827' }}>
          Interface Caisse & Vente Directe Comptoir
        </h2>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
          Saisie rapide des ventes comptoir avec décrémentation automatique du stock en temps réel
        </p>
      </div>

      {successMsg && (
        <div style={{ padding: 14, background: '#D1FAE5', color: '#065F46', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem' }}>
          ✓ {successMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Colonne Sélection */}
        <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #E5E7EB' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 700 }}>Ajouter un Article à la Vente</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                Sélectionner l'Article en Stock
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB', fontWeight: 600 }}
              >
                {stockItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.quantity} {item.unit} dispo) — {item.sellingPrice.toLocaleString()} XOF
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                Quantité Vendue
              </label>
              <input
                type="number"
                min="1"
                value={qtyToSell}
                onChange={(e) => setQtyToSell(Number(e.target.value))}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB', fontWeight: 700 }}
              />
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              style={{
                padding: 12,
                borderRadius: 8,
                border: 'none',
                background: themeColor,
                color: 'white',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: 6,
              }}
            >
              + Ajouter au Panier Caisse
            </button>
          </div>
        </div>

        {/* Colonne Panier Caisse */}
        <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 700 }}>Panier de Vente Actuel</h3>

            {cart.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#9CA3AF', fontSize: '0.88rem' }}>
                Le panier est vide. Sélectionnez un article pour commencer la vente.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cart.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F9FAFB', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        {c.quantity} x {c.unitPrice.toLocaleString()} XOF
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontWeight: 800, color: themeColor }}>{(c.quantity * c.unitPrice).toLocaleString()} XOF</span>
                      <button onClick={() => handleRemoveFromCart(idx)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontWeight: 700 }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 20, borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: '#111827', marginBottom: 14 }}>
              <span>Total Caisse :</span>
              <span style={{ color: themeColor, fontFamily: "'Sora', sans-serif" }}>{totalCart().toLocaleString()} XOF</span>
            </div>

            <button
              onClick={handleValidateSale}
              disabled={cart.length === 0 || submitting}
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 10,
                border: 'none',
                background: cart.length === 0 ? '#CBD5E1' : themeColor,
                color: 'white',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Validation Caisse...' : 'Encaisser la Vente ✓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
