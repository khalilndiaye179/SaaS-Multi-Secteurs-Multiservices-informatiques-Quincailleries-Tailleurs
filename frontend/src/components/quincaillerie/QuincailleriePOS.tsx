import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface Depot {
  id: string;
  name: string;
  isMain: boolean;
}

interface StockItem {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  quantity: number;
  balances: { depotId: string; quantity: number }[];
}

interface CartItem extends StockItem {
  cartQuantity: number;
}

interface CompletedSaleReceipt {
  invoiceNumber: string;
  clientName: string;
  date: string;
  total: number;
  received: number;
  change: number;
  depotName: string;
  lines: { name: string; quantity: number; price: number }[];
}

export default function QuincailleriePOS() {
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedDepot, setSelectedDepot] = useState<string>('');
  const [items, setItems] = useState<StockItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modals & Receipts
  const [receipt, setReceipt] = useState<CompletedSaleReceipt | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [depotsData, stockData] = await Promise.all([
        api.get('/quincaillerie/depots'),
        api.get('/quincaillerie/stock')
      ]);
      setDepots(depotsData);
      setItems(stockData);
      const mainDepot = depotsData.find((d: any) => d.isMain);
      if (mainDepot) setSelectedDepot(mainDepot.id);
      else if (depotsData.length > 0) setSelectedDepot(depotsData[0].id);
    } catch (e) {
      triggerToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableQuantity = (item: StockItem) => {
    if (!selectedDepot) return item.quantity;
    const balance = item.balances?.find(b => b.depotId === selectedDepot);
    return balance ? balance.quantity : 0;
  };

  const filteredItems = items.filter(item => 
    (item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase())) &&
    getAvailableQuantity(item) > 0
  );

  const addToCart = (item: StockItem) => {
    const available = getAvailableQuantity(item);
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      if (existing.cartQuantity < available) {
        setCart(cart.map(c => c.id === item.id ? { ...c, cartQuantity: c.cartQuantity + 1 } : c));
        triggerToast(`Ajouté au panier: ${item.name}`);
      } else {
        triggerToast('Stock insuffisant dans ce dépôt', 'error');
      }
    } else {
      setCart([...cart, { ...item, cartQuantity: 1 }]);
      triggerToast(`Ajouté au panier: ${item.name}`);
    }
  };

  const updateCartQuantity = (id: string, delta: number) => {
    const existing = cart.find(c => c.id === id);
    if (!existing) return;
    const available = getAvailableQuantity(existing);
    const newQuantity = existing.cartQuantity + delta;
    if (newQuantity <= 0) {
      setCart(cart.filter(c => c.id !== id));
      triggerToast('Article retiré du panier');
    } else if (newQuantity > available) {
      triggerToast('Stock insuffisant dans ce dépôt', 'error');
    } else {
      setCart(cart.map(c => c.id === id ? { ...c, cartQuantity: newQuantity } : c));
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.sellingPrice * item.cartQuantity), 0);
  const change = amountReceived > 0 ? amountReceived - total : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (amountReceived > 0 && amountReceived < total) {
      triggerToast('Le montant reçu est inférieur au total à payer', 'error');
      return;
    }
    
    setIsProcessing(true);
    try {
      const lines = cart.map(item => ({
        stockItemId: item.id,
        quantity: item.cartQuantity,
        sellingPrice: item.sellingPrice
      }));

      const payload = {
        lines,
        clientName: 'Client Comptoir',
        generateInvoice: true,
        depotId: selectedDepot
      };

      const res = await api.post('/quincaillerie/stock/direct-sale', payload);
      triggerToast('Vente enregistrée avec succès !');

      const depotName = depots.find(d => d.id === selectedDepot)?.name || '';

      // Prepare receipt
      setReceipt({
        invoiceNumber: res.invoiceNumber || `FAC-${Date.now().toString().substring(6)}`,
        clientName: 'Client Comptoir',
        date: new Date().toLocaleString('fr-FR'),
        total,
        received: amountReceived || total,
        change: amountReceived ? change : 0,
        depotName,
        lines: cart.map(i => ({ name: i.name, quantity: i.cartQuantity, price: i.sellingPrice }))
      });
      
      // Reset
      setCart([]);
      setAmountReceived(0);
      setSearch('');
      fetchData(); // Refresh stock
      
    } catch (e: any) {
      triggerToast(e.response?.data?.message || 'Erreur lors de la vente', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const quickPay = (val: number) => {
    setAmountReceived(val);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: '#059669', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 600 }}>Ouverture de la caisse...</span>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { to { transform: rotate(360deg); } }`}} />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Outfit', 'Inter', sans-serif", display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: 16 }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: toast.type === 'success' ? '#059669' : '#EF4444',
          color: 'white',
          padding: '12px 20px',
          borderRadius: 12,
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          zIndex: 9999,
          fontWeight: 700,
          fontSize: '0.9rem',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '16px 24px', borderRadius: 16, border: '1px solid #E2E8F0' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>🛒 Caisse & Encaissement Rapide</h2>
          <p style={{ color: '#64748B', fontSize: '0.82rem', margin: '2px 0 0 0' }}>Enregistrement direct des ventes comptoir.</p>
        </div>
        
        {depots.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', padding: '8px 16px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B' }}>DÉPÔT D'EXPÉDITION :</span>
            <select 
              value={selectedDepot}
              onChange={(e) => {
                setSelectedDepot(e.target.value);
                setCart([]); // Vider le panier si on change de dépôt
              }}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontWeight: 800,
                color: '#059669',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              {depots.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'flex', flex: 1, gap: 20, minHeight: 0 }}>
        {/* Left: Products list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Search bar */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', padding: '12px 18px', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '1.2rem', marginRight: 10 }}>🔍</span>
            <input 
              type="text"
              placeholder="Rechercher un article par SKU, désignation ou code barre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: '1rem', fontWeight: 600, color: '#1E293B' }}
              autoFocus
            />
          </div>

          {/* Products Grid */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
              {filteredItems.map(item => {
                const available = getAvailableQuantity(item);
                return (
                  <div 
                    key={item.id} 
                    onClick={() => addToCart(item)}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: 14,
                      padding: 16,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#059669';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.04)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>{item.sku}</span>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1E293B', margin: '4px 0 0 0', lineHeight: 1.3 }}>{item.name}</h4>
                    </div>
                    
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                        <span>En stock:</span>
                        <span style={{ fontWeight: 800, color: available > 5 ? '#334155' : '#D97706' }}>{available}</span>
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#059669', marginTop: 6 }}>
                        {item.sellingPrice.toLocaleString()} F
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredItems.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '48px 24px', textAlign: 'center', color: '#94A3B8', fontSize: '0.9rem' }}>
                  Aucun produit trouvé en stock dans ce dépôt.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Cart & Paypad */}
        <div style={{ width: 420, display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          {/* Cart Header */}
          <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>🛒 Panier ({cart.length})</h3>
            {cart.length > 0 && (
              <button 
                onClick={() => setCart([])}
                style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Vider
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cart.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', gap: 8 }}>
                <span style={{ fontSize: '2.5rem', opacity: 0.3 }}>🛒</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Le panier est vide</span>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #F1F5F9' }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1E293B', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.name}</h4>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#059669', display: 'block', marginTop: 4 }}>{(item.sellingPrice * item.cartQuantity).toLocaleString()} F</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '2px 6px' }}>
                    <button 
                      onClick={() => updateCartQuantity(item.id, -1)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: 4 }}
                    >
                      ➖
                    </button>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, width: 20, textAlign: 'center' }}>{item.cartQuantity}</span>
                    <button 
                      onClick={() => updateCartQuantity(item.id, 1)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: 4, color: '#059669' }}
                    >
                      ➕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Pad & Checkout */}
          <div style={{ padding: 20, borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748B' }}>TOTAL A PAYER :</span>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: '#1E293B', letterSpacing: '-0.03em' }}>{total.toLocaleString()} F</span>
            </div>

            {/* Quick cash suggestions */}
            {total > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
                {[total, 1000, 2000, 5000, 10000, 20000].filter(v => v >= total).slice(0, 4).map(val => (
                  <button
                    key={val}
                    onClick={() => quickPay(val)}
                    style={{
                      background: '#FFFFFF',
                      border: '1.5px solid ' + (amountReceived === val ? '#059669' : '#E2E8F0'),
                      color: amountReceived === val ? '#059669' : '#475569',
                      padding: '8px 4px',
                      borderRadius: 8,
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {val.toLocaleString()} F
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>MONTANT COMPTANT REÇU :</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={amountReceived || ''}
                    onChange={(e) => setAmountReceived(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #E2E8F0',
                      fontSize: '1.1rem',
                      fontWeight: 900,
                      color: '#1E293B',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                    placeholder="Ex: 5000"
                  />
                  {amountReceived > 0 && (
                    <button
                      onClick={() => setAmountReceived(0)}
                      style={{ position: 'absolute', right: 12, top: 12, border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8', fontWeight: 800 }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {amountReceived > 0 && change >= 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ECFDF5', padding: '10px 14px', borderRadius: 8, border: '1px solid #A7F3D0', color: '#065F46', fontSize: '0.88rem', fontWeight: 700 }}>
                  <span>Monnaie à rendre :</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 900 }}>{change.toLocaleString()} F</span>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessing || (amountReceived > 0 && amountReceived < total)}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 900,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px 0 rgba(5, 150, 105, 0.3)',
                  transition: 'all 0.2s',
                  marginTop: 6
                }}
              >
                {isProcessing ? 'Enregistrement...' : '🛒 Encaisser & Ticket (F12)'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL TICKET DE CAISSE INTERACTIF (MODERNE) ─── */}
      {receipt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            width: '100%',
            maxWidth: 380,
            animation: 'scaleUp 0.3s ease-out',
            overflow: 'hidden'
          }}>
            {/* Ticket Content */}
            <div id="printable-ticket" style={{ padding: '30px 24px', background: '#FFF9F2', color: '#1E293B', fontFamily: 'monospace' }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '0 0 4px 0' }}>QUINCAILLERIE GENERALE</h2>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>DEPOT : {receipt.depotName}</p>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0' }}>Date : {receipt.date}</p>
              </div>

              <div style={{ borderBottom: '1px dashed #CBD5E1', paddingBottom: 10, marginBottom: 10, fontSize: '0.75rem' }}>
                <strong>Ticket N°:</strong> {receipt.invoiceNumber}<br />
                <strong>Client:</strong> {receipt.clientName}
              </div>

              {/* Lines */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.78rem', marginBottom: 14 }}>
                {receipt.lines.map((l, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{l.quantity}x {l.name}</span>
                    <span>{(l.price * l.quantity).toLocaleString()} F</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '0.95rem' }}>
                  <span>TOTAL :</span>
                  <span>{receipt.total.toLocaleString()} F</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Reçu :</span>
                  <span>{receipt.received.toLocaleString()} F</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Rendu :</span>
                  <span>{receipt.change.toLocaleString()} F</span>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.7rem', color: '#64748B' }}>
                Merci de votre confiance !<br />
                A bientôt.
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: '16px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  const printContents = document.getElementById('printable-ticket')?.innerHTML;
                  const originalContents = document.body.innerHTML;
                  if (printContents) {
                    document.body.innerHTML = printContents;
                    window.print();
                    document.body.innerHTML = originalContents;
                    window.location.reload(); // Reload to restore state handlers
                  }
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                🖨️ Imprimer
              </button>
              <button
                onClick={() => setReceipt(null)}
                style={{
                  padding: '12px 20px',
                  background: '#E2E8F0',
                  color: '#475569',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}} />
    </div>
  );
}
