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
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [depots, setDepots] = useState<any[]>([]);


  // Form New Article
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('sac');
  const [purchasePrice, setPurchasePrice] = useState(3000);
  const [sellingPrice, setSellingPrice] = useState(4500);
  const [quantity, setQuantity] = useState(50);
  const [alertThreshold, setAlertThreshold] = useState(10);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [articleDepotId, setArticleDepotId] = useState('');

  // Transfer states
  const [transferItemId, setTransferItemId] = useState('');
  const [sourceDepotId, setSourceDepotId] = useState('');
  const [targetDepotId, setTargetDepotId] = useState('');
  const [transferQuantity, setTransferQuantity] = useState(1);

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
      const [stockRes, depotsRes] = await Promise.all([
        fetch('/api/quincaillerie/stock', { headers }),
        fetch('/api/quincaillerie/depots', { headers })
      ]);
      if (stockRes.ok) {
        const data = await stockRes.json();
        setItems(Array.isArray(data) ? data : []);
        if (onStockUpdated) onStockUpdated();
      } else {
        setItems([]);
      }
      if (depotsRes.ok) {
        setDepots(await depotsRes.json());
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
      const url = editingItemId ? `/api/quincaillerie/stock/${editingItemId}` : '/api/quincaillerie/stock';
      const method = editingItemId ? 'PUT' : 'POST';
      
      const payload: any = {
        name,
        sku,
        unit,
        purchasePrice,
        sellingPrice,
        alertThreshold,
      };

      if (!editingItemId) {
        payload.quantity = quantity;
        payload.depotId = articleDepotId;
      }

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        setName('');
        setSku('');
        setArticleDepotId('');
        fetchStock();
      } else {
        const err = await res.json();
        alert(err.message || "Erreur lors de l'enregistrement de l'article.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferItemId || !sourceDepotId || !targetDepotId || transferQuantity <= 0) {
      alert("Veuillez remplir tous les champs correctement.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/quincaillerie/stock/transfer', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          stockItemId: transferItemId,
          sourceDepotId,
          destinationDepotId: targetDepotId,
          quantity: transferQuantity
        })
      });
      if (res.ok) {
        setShowTransferModal(false);
        fetchStock();
      } else {
        const err = await res.json();
        alert(err.message || 'Erreur lors du transfert');
      }
    } catch(e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: 'var(--text-main)' }}>
            Inventaire & Stock Quincaillerie ({items.length})
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Gestion des matériaux, quincaillerie lourde/légère et alerte de stock bas
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => {
              setTransferItemId(''); setSourceDepotId(''); setTargetDepotId(''); setTransferQuantity(1);
              setShowTransferModal(true);
            }}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: '#1E293B',
              color: 'white',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            🔄 Transférer Stock
          </button>
          <button
            onClick={() => {
              setEditingItemId(null);
              setName(''); setSku(''); setPurchasePrice(0); setSellingPrice(0); setQuantity(0); setAlertThreshold(5);
              setShowModal(true);
            }}
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
            + Ajouter un Article
          </button>
        </div>
      </div>

      {items.filter(i => (i.quantity || 0) <= (i.alertThreshold || 0)).length > 0 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <div>
            <h3 style={{ margin: 0, color: '#991B1B', fontSize: '0.95rem', fontWeight: 800 }}>Alerte de Rupture de Stock</h3>
            <p style={{ margin: 0, color: '#B91C1C', fontSize: '0.85rem' }}>
              Vous avez <strong>{items.filter(i => (i.quantity || 0) <= (i.alertThreshold || 0)).length}</strong> article(s) dont la quantité est critique. Pensez à réapprovisionner.
            </p>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement du stock...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
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
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Aucun article en stock pour le moment.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item?.id || Math.random()} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700 }}>{item?.name || 'Article'}</td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{item?.sku || '—'}</td>
                    <td style={{ padding: '14px 18px' }}>{item?.purchasePrice ? Number(item.purchasePrice).toLocaleString() : 0} XOF</td>
                    <td style={{ padding: '14px 18px', fontWeight: 800, color: themeColor }}>
                      {item?.sellingPrice ? Number(item.sellingPrice).toLocaleString() : 0} XOF
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: 20,
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            background: (item?.quantity || 0) <= (item?.alertThreshold || 0) ? '#FEE2E2' : '#E0E7FF',
                            color: (item?.quantity || 0) <= (item?.alertThreshold || 0) ? '#DC2626' : '#3730A3',
                            display: 'inline-block',
                            width: 'fit-content'
                          }}
                        >
                          Total: {item?.quantity || 0} {item?.unit || 'unité'}
                        </span>
                        {(item as any).balances?.map((b: any) => {
                          const depot = depots.find(d => d.id === b.depotId);
                          return (
                            <span key={b.id} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {depot?.name}: {b.quantity}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>&le; {item?.alertThreshold || 0} {item?.unit || 'unité'}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItemId ? "Modifier l'Article" : "Ajouter un Article au Stock"}>
        <form onSubmit={handleCreateArticle} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
              Désignation de l'Article
            </label>
            <input
              required
              placeholder="ex: Ciment SOCOCIM 50kg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                SKU / Référence
              </label>
              <input
                required
                placeholder="ex: CIM-SOC-50"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                Unité de Vente
              </label>
              <input
                required
                placeholder="ex: sac, kg, pièce"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                Prix d'Achat (XOF)
              </label>
              <input
                type="number"
                required
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                Prix de Vente (XOF)
              </label>
              <input
                type="number"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: editingItemId ? '1fr' : '1fr 1fr', gap: 10 }}>
            {!editingItemId && (
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Quantité Initiale
                </label>
                <input
                  type="number"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                Seuil Alerte
              </label>
              <input
                type="number"
                required
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
              />
            </div>
          </div>

          {!editingItemId && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                Dépôt d'Affectation Initial *
              </label>
              <select
                required
                value={articleDepotId}
                onChange={(e) => setArticleDepotId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
              >
                <option value="">Sélectionner un dépôt</option>
                {depots.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
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
            {submitting ? 'Enregistrement...' : 'Enregistrer au Stock'}
          </button>
        </form>
      </Modal>

      {/* Modal Transfert */}
      <Modal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} title="Transférer du Stock">
        <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Article</label>
            <select
              required
              value={transferItemId}
              onChange={e => setTransferItemId(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
            >
              <option value="">Sélectionner un article</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>{item.name} (Total: {item.quantity})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Dépôt Source</label>
              <select
                required
                value={sourceDepotId}
                onChange={e => setSourceDepotId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
              >
                <option value="">Sélectionner source</option>
                {depots.map(depot => (
                  <option key={depot.id} value={depot.id}>{depot.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Dépôt Destination</label>
              <select
                required
                value={targetDepotId}
                onChange={e => setTargetDepotId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
              >
                <option value="">Sélectionner destination</option>
                {depots.map(depot => (
                  <option key={depot.id} value={depot.id}>{depot.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Quantité à transférer</label>
            <input
              type="number"
              required
              min={1}
              value={transferQuantity}
              onChange={e => setTransferQuantity(Number(e.target.value))}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)' }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{ padding: 12, borderRadius: 8, border: 'none', background: '#3730A3', color: 'white', fontWeight: 700, cursor: 'pointer', marginTop: 10 }}
          >
            {submitting ? 'Transfert en cours...' : 'Valider le transfert'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default QuincaillerieStockManager;
