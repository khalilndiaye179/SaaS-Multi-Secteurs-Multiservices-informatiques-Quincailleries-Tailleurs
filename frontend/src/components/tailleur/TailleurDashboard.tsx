import React, { useState } from 'react';

interface ClientMeasurementCard {
  id: string;
  clientName: string;
  clientPhone: string;
  garmentType: string;
  measurements: Record<string, number | string>;
  notes?: string;
  createdAt: string;
}

const DEMO_MEASUREMENTS: ClientMeasurementCard[] = [
  {
    id: '1',
    clientName: 'Fatou Binetou Ndiaye',
    clientPhone: '77 333 22 11',
    garmentType: 'Boubou 3 Pièces (Bazin Rich)',
    measurements: {
      tourPoitrine: 98,
      tourTaille: 82,
      tourHanches: 106,
      longueurBoubou: 145,
      longueurManche: 60,
      tourBras: 34,
    },
    notes: 'Tissu fourni par la cliente (Couleur Violet Royal). Broderie dorée au col.',
    createdAt: '2026-08-07',
  },
  {
    id: '2',
    clientName: 'El Hadji Malick Fall',
    clientPhone: '78 555 44 33',
    garmentType: 'Costume Sur-Mesure 2 Pièces',
    measurements: {
      carrureEpaule: 46,
      tourPoitrine: 104,
      tourTaillePantalon: 88,
      longueurPantalon: 102,
      longueurVeste: 75,
    },
    notes: 'Essayage prévu le 14 Août. Boutons nacrés.',
    createdAt: '2026-08-09',
  },
];

export const TailleurDashboard: React.FC = () => {
  const [measurements, setMeasurements] = useState<ClientMeasurementCard[]>(DEMO_MEASUREMENTS);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = measurements.filter(
    (m) =>
      m.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.garmentType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl">
            ✂️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Atelier Couture Elegance</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Secteur Couture & Tailleur
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Carnet de Mesures Clients & Suivi des Confections</p>
          </div>
        </div>

        <button className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2">
          + Nouvelle Fiche Client
        </button>
      </div>

      {/* Search & Actions */}
      <div className="flex justify-between items-center gap-4">
        <input
          type="text"
          placeholder="Rechercher un client ou un type de vêtement..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Measurements Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((m) => (
          <div key={m.id} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 hover:border-slate-700 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-white">{m.clientName}</h3>
                <span className="text-xs font-mono text-emerald-400">{m.clientPhone}</span>
              </div>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {m.garmentType}
              </span>
            </div>

            {/* Dynamic JSON Measurements Display */}
            <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/60">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Mesures enregistrées (cm)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(m.measurements).map(([key, val]) => (
                  <div key={key} className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="block text-[10px] text-slate-400 font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="text-sm font-bold text-emerald-400">{val} cm</span>
                  </div>
                ))}
              </div>
            </div>

            {m.notes && (
              <p className="text-xs text-slate-400 italic bg-slate-800/30 p-3 rounded-xl border border-slate-800/40">
                📌 {m.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
