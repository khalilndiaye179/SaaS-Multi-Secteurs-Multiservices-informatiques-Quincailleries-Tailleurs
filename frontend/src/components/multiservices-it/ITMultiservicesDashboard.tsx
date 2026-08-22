import React, { useState } from 'react';

interface Ticket {
  id: string;
  ticketNumber: string;
  clientName: string;
  clientPhone: string;
  deviceModel: string;
  issueDesc: string;
  status: 'RECEIVED' | 'DIAGNOSIS' | 'IN_REPAIR' | 'READY' | 'DELIVERED';
  estimatedCost?: number;
  createdAt: string;
}

const DEMO_TICKETS: Ticket[] = [
  { id: '1', ticketNumber: 'TCK-0001', clientName: 'Mamadou Diallo', clientPhone: '77 123 45 67', deviceModel: 'HP EliteBook 840 G5', issueDesc: 'Écran noir au démarrage, bip sonore', status: 'IN_REPAIR', estimatedCost: 35000, createdAt: '2026-08-08' },
  { id: '2', ticketNumber: 'TCK-0002', clientName: 'Awa Seck', clientPhone: '78 987 65 43', deviceModel: 'MacBook Air M1', issueDesc: 'Remplacement batterie + dépoussiérage', status: 'READY', estimatedCost: 65000, createdAt: '2026-08-09' },
  { id: '3', ticketNumber: 'TCK-0003', clientName: 'Ousmane Sow', clientPhone: '70 444 55 66', deviceModel: 'Lenovo ThinkPad T480', issueDesc: 'Problème de chargeur et port USB-C dessoudé', status: 'DIAGNOSIS', estimatedCost: 20000, createdAt: '2026-08-09' },
];

const STATUS_CONFIG = {
  RECEIVED: { label: 'Reçu', bg: 'bg-[var(--bg-main)]0/20', text: 'text-[var(--text-muted)]', border: 'border-slate-500/30' },
  DIAGNOSIS: { label: 'En Diagnostic', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  IN_REPAIR: { label: 'En Réparation', bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  READY: { label: 'Prêt', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  DELIVERED: { label: 'Livré / Payé', bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30' },
};

export const ITMultiservicesDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>(DEMO_TICKETS);
  const [activeTab, setActiveTab] = useState<string>('ALL');

  const filteredTickets = tickets.filter((t) => (activeTab === 'ALL' ? true : t.status === activeTab));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-3xl">
            💻
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[var(--text-main)]">Multiservices IT Dakar</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                Secteur Multiservices IT
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">Atelier de Réparation, Dépannage & Vente Matériel</p>
          </div>
        </div>

        <button className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2">
          + Nouveau Ticket SAV
        </button>
      </div>

      {/* Tabs / Kanban Filters */}
      <div className="flex gap-2 border-b border-[var(--border-color)] overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'ALL' ? 'bg-cyan-500 text-slate-950' : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          Tous ({tickets.length})
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = tickets.filter((t) => t.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === key ? 'bg-[var(--bg-card)] text-[var(--text-main)] border border-cyan-500/40' : 'bg-[var(--bg-main)]/60 text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <span>{cfg.label}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-950 text-[10px]">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTickets.map((t) => {
          const cfg = STATUS_CONFIG[t.status];
          return (
            <div key={t.id} className="bg-[var(--bg-main)]/80 border border-[var(--border-color)] rounded-3xl p-6 shadow-xl space-y-4 hover:border-[var(--border-color)] transition-all">
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono text-cyan-400 font-bold px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  {t.ticketNumber}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                  {cfg.label}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[var(--text-main)]">{t.deviceModel}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{t.issueDesc}</p>
              </div>

              <div className="pt-4 border-t border-[var(--border-color)]/80 flex justify-between items-center text-xs">
                <div>
                  <span className="block text-[var(--text-muted)]">{t.clientName}</span>
                  <span className="block font-mono text-[var(--text-muted)]">{t.clientPhone}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[var(--text-muted)]">Devis estimé</span>
                  <span className="font-bold text-cyan-400">{t.estimatedCost?.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
