import React, { useState } from 'react';

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

const DEMO_ITEMS: StockItem[] = [
  { id: '1', name: 'Ciment Dangote 50kg', sku: 'CIM-DAN-50', unit: 'Sac', purchasePrice: 4200, sellingPrice: 4800, quantity: 120, alertThreshold: 25 },
  { id: '2', name: 'Fer à Béton 12mm (6m)', sku: 'FER-BET-12', unit: 'Barre', purchasePrice: 3100, sellingPrice: 3700, quantity: 18, alertThreshold: 30 },
  { id: '3', name: 'Peinture Mat Blanche 20L', sku: 'PNT-MAT-20', unit: 'Pot', purchasePrice: 18000, sellingPrice: 23500, quantity: 8, alertThreshold: 10 },
  { id: '4', name: 'Pointes de Charpente 80mm', sku: 'PNT-CHA-80', unit: 'Kg', purchasePrice: 850, sellingPrice: 1200, quantity: 45, alertThreshold: 15 },
];

export const QuincaillerieDashboard: React.FC = () => {
  const [items, setItems] = useState<StockItem[]>(DEMO_ITEMS);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStockValue = items.reduce((acc, item) => acc + item.sellingPrice * item.quantity, 0);
  const alertsCount = items.filter((item) => item.quantity <= item.alertThreshold).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl">
            🔩
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Quincaillerie Al-Baraka</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Secteur Quincaillerie
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Gestion de Stock & Point de Vente — Devise XOF</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
        >
          + Ajouter un Article
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <span className="text-xs font-medium text-slate-400">Total Références</span>
          <div className="text-3xl font-extrabold text-white mt-2">{items.length}</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <span className="text-xs font-medium text-slate-400">Valorisation du Stock</span>
          <div className="text-3xl font-extrabold text-amber-400 mt-2">
            {totalStockValue.toLocaleString('fr-FR')} <span className="text-sm">FCFA</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-red-500/30 rounded-2xl p-6">
          <span className="text-xs font-medium text-red-400">Alertes Rupture</span>
          <div className="text-3xl font-extrabold text-red-400 mt-2">{alertsCount} article(s)</div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center gap-4">
          <input
            type="text"
            placeholder="Rechercher par nom ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-400 bg-slate-950/60 uppercase border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Article</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Unité</th>
                <th className="py-3.5 px-4">Prix Achat</th>
                <th className="py-3.5 px-4">Prix Vente</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.map((item) => {
                const isAlert = item.quantity <= item.alertThreshold;
                return (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 font-semibold text-white">{item.name}</td>
                    <td className="py-4 px-4 text-xs font-mono text-slate-400">{item.sku}</td>
                    <td className="py-4 px-4 text-slate-300">{item.unit}</td>
                    <td className="py-4 px-4 text-slate-400">{item.purchasePrice.toLocaleString('fr-FR')} FCFA</td>
                    <td className="py-4 px-4 text-amber-400 font-bold">{item.sellingPrice.toLocaleString('fr-FR')} FCFA</td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isAlert
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {item.quantity} {item.unit} {isAlert && '⚠️'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">Mouvement →</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
