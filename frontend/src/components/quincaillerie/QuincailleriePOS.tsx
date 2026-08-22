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
  balances: { depotId: string, quantity: number }[];
}

interface CartItem extends StockItem {
  cartQuantity: number;
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

  useEffect(() => {
    fetchData();
  }, []);

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
      alert('Erreur lors du chargement des articles');
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
      } else {
        alert('Stock insuffisant');
      }
    } else {
      setCart([...cart, { ...item, cartQuantity: 1 }]);
    }
  };

  const updateCartQuantity = (id: string, delta: number) => {
    const existing = cart.find(c => c.id === id);
    if (!existing) return;
    const available = getAvailableQuantity(existing);
    const newQuantity = existing.cartQuantity + delta;
    if (newQuantity <= 0) {
      setCart(cart.filter(c => c.id !== id));
    } else if (newQuantity > available) {
      alert('Stock insuffisant');
    } else {
      setCart(cart.map(c => c.id === id ? { ...c, cartQuantity: newQuantity } : c));
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.sellingPrice * item.cartQuantity), 0);
  const change = amountReceived - total;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (amountReceived > 0 && amountReceived < total) {
      alert('La quantité ne peut pas être supérieure au stock disponible');
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
      alert('Vente effectuée avec succès !');
      
      // Reset
      setCart([]);
      setAmountReceived(0);
      setSearch('');
      fetchData(); // Refresh stock
      
      // TODO: Imprimer ticket (res.data.invoiceNumber)
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur lors de la vente');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Chargement de la caisse...</div>;

  return (
    <div className="flex flex-col h-full bg-gray-50 -m-6 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Caisse Rapide (POS)</h2>
          <p className="text-gray-500">Encaissement et génération de tickets</p>
        </div>
        
        {depots.length > 0 && (
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
            <span className="text-sm font-medium text-gray-500">Dépôt Actif :</span>
            <select 
              value={selectedDepot}
              onChange={(e) => {
                setSelectedDepot(e.target.value);
                setCart([]); // Vider le panier si on change de dépôt
              }}
              className="text-sm font-bold text-brand-600 bg-transparent outline-none cursor-pointer"
            >
              {depots.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-1 gap-6 min-h-[600px]">
        {/* Left: Products Grid */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4 flex items-center shadow-sm">
            <div className="text-gray-400 mr-3">🔍</div>
            <input 
              type="text"
              placeholder="Rechercher par nom ou code barre (SKU)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none text-lg"
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => addToCart(item)}
                  className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-brand-500 hover:shadow-md transition select-none flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight mb-1">{item.name}</h3>
                    <p className="text-xs text-gray-400 mb-2">{item.sku}</p>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      Stock: <span className="font-bold text-gray-700">{getAvailableQuantity(item)}</span>
                    </div>
                    <div className="text-lg font-black text-brand-600">
                      {item.sellingPrice.toLocaleString()} F
                    </div>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400">
                  Aucun article trouvé ou en stock.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Cart & Checkout */}
        <div className="w-[400px] bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 flex items-center">
              🛒 Panier en cours
            </h3>
            {cart.length > 0 && (
              <button 
                onClick={() => setCart([])}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Vider
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <div className="text-4xl mb-4 opacity-20">🛒</div>
                <p>Panier vide</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between border border-gray-100">
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="font-bold text-gray-900 truncate text-sm">{item.name}</h4>
                      <div className="text-brand-600 font-bold text-sm">{(item.sellingPrice * item.cartQuantity).toLocaleString()} F</div>
                    </div>
                    
                    <div className="flex items-center space-x-3 bg-white border border-gray-200 rounded-lg p-1">
                      <button onClick={() => updateCartQuantity(item.id, -1)} className="p-1 hover:bg-gray-100 rounded">
                        ➖
                      </button>
                      <span className="font-bold w-6 text-center">{item.cartQuantity}</span>
                      <button onClick={() => updateCartQuantity(item.id, 1)} className="p-1 hover:bg-gray-100 rounded text-brand-600">
                        ➕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout Section */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex justify-between items-center mb-4 text-xl">
              <span className="font-bold text-gray-500">Total</span>
              <span className="font-black text-brand-600 text-3xl">{total.toLocaleString()} F</span>
            </div>

            <div className="mb-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Montant Reçu (XOF)</label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-gray-400">💵</div>
                  <input
                    type="number"
                    value={amountReceived || ''}
                    onChange={(e) => setAmountReceived(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="Ex: 10000"
                  />
                </div>
              </div>
              
              {amountReceived > 0 && change >= 0 && (
                <div className="flex justify-between items-center bg-green-50 text-green-700 p-3 rounded-xl border border-green-200">
                  <span className="font-bold">Monnaie à rendre :</span>
                  <span className="font-black text-xl">{change.toLocaleString()} F</span>
                </div>
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing || (amountReceived > 0 && amountReceived < total)}
              className="w-full py-4 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg flex items-center justify-center transition shadow-lg shadow-brand-500/30"
            >
              {isProcessing ? 'Validation...' : 'Valider & Imprimer (F12) 🖨️'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
