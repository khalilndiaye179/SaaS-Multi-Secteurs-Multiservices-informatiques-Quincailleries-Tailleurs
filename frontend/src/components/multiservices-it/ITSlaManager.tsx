import React, { useState } from 'react';
import { Modal } from '../shared/Modal';

interface SlaPolicy {
  id: string;
  name: string;
  priority: 'CRITICAL' | 'HIGH' | 'STANDARD' | 'LOW';
  targetHours: number;
  description: string;
  penaltyPerDayXOF: number;
  status: 'ACTIVE' | 'INACTIVE';
}

interface Props {
  themeColor: string;
}

export const ITSlaManager: React.FC<Props> = ({ themeColor }) => {
  const user = JSON.parse(localStorage.getItem('kpsy_user') || '{}');
  const isAdmin = !user?.roles || user?.roles?.length === 0 || user?.roles?.includes('TENANT_ADMIN') || user?.roles?.includes('ADMIN_TENANT') || user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN');

  const [policies, setPolicies] = useState<SlaPolicy[]>([
    { id: '1', name: 'SLA Critique — Interventions Serveurs & Réseau', priority: 'CRITICAL', targetHours: 4, description: 'Prise en charge sous 1h, résolution max 4h pour panne totale réseau entreprise', penaltyPerDayXOF: 50000, status: 'ACTIVE' },
    { id: '2', name: 'SLA Urgence — Matériel de Production / PC Gérant', priority: 'HIGH', targetHours: 24, description: 'Remplacement écran ou carte mère sous 24h avec prêt de machine', penaltyPerDayXOF: 20000, status: 'ACTIVE' },
    { id: '3', name: 'SLA Standard — Maintenance & Formatage Atelier', priority: 'STANDARD', targetHours: 48, description: 'Réinstallation système, nettoyage et dépoussiérage standard', penaltyPerDayXOF: 5000, status: 'ACTIVE' },
    { id: '4', name: 'SLA Basse Priorité — Diagnostics Complémentaires', priority: 'LOW', targetHours: 72, description: 'Extraction longue de données sur disques durs usagés', penaltyPerDayXOF: 0, status: 'ACTIVE' },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [priority, setPriority] = useState<SlaPolicy['priority']>('STANDARD');
  const [targetHours, setTargetHours] = useState(48);
  const [description, setDescription] = useState('');
  const [penaltyPerDayXOF, setPenaltyPerDayXOF] = useState(5000);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setPriority('STANDARD');
    setTargetHours(48);
    setDescription('');
    setPenaltyPerDayXOF(5000);
    setShowModal(true);
  };

  const handleOpenEdit = (p: SlaPolicy) => {
    setEditingId(p.id);
    setName(p.name);
    setPriority(p.priority);
    setTargetHours(p.targetHours);
    setDescription(p.description);
    setPenaltyPerDayXOF(p.penaltyPerDayXOF);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) {
      alert('Action réservée à l\'Administrateur.');
      return;
    }
    if (window.confirm('Voulez-vous supprimer ce niveau d\'engagement SLA ?')) {
      setPolicies(policies.filter((p) => p.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setPolicies(policies.map((p) => (p.id === editingId ? { ...p, name, priority, targetHours, description, penaltyPerDayXOF } : p)));
    } else {
      const newPolicy: SlaPolicy = {
        id: Date.now().toString(),
        name,
        priority,
        targetHours,
        description,
        penaltyPerDayXOF,
        status: 'ACTIVE',
      };
      setPolicies([...policies, newPolicy]);
    }
    setShowModal(false);
  };

  const getPriorityBadge = (p: SlaPolicy['priority']) => {
    const map = {
      CRITICAL: { bg: '#FEE2E2', color: '#DC2626', label: '🔴 CRITIQUE (<4h)' },
      HIGH: { bg: '#FEF3C7', color: '#D97706', label: '🟠 HAUTE (<24h)' },
      STANDARD: { bg: '#E0E7FF', color: '#4338CA', label: '🟡 STANDARD (<48h)' },
      LOW: { bg: '#D1FAE5', color: '#059669', label: '🟢 BASSE (<72h)' },
    };
    const b = map[p];
    return <span style={{ padding: '4px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.75rem', background: b.bg, color: b.color }}>{b.label}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: '#111827' }}>
            Niveaux de Service & Engagements SLA ({policies.length})
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
            Configuration des délais de prise en charge et de résolution des pannes pour vos clients et contrats
          </p>
        </div>

        {isAdmin && (
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
            + Définir une Règle SLA
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {policies.map((p) => (
          <div key={p.id} style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                {getPriorityBadge(p.priority)}
                <span style={{ fontSize: '1rem', fontWeight: 800, color: themeColor }}>⏱️ Délai Max : {p.targetHours}h</span>
              </div>

              <h3 style={{ margin: '0 0 6px 0', fontSize: '0.98rem', fontWeight: 700, color: '#111827' }}>{p.name}</h3>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: '#6B7280', lineHeight: 1.4 }}>{p.description}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: 10, marginTop: 10 }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                Pénalité Retard : {p.penaltyPerDayXOF ? `${p.penaltyPerDayXOF.toLocaleString()} XOF / Jour` : 'Aucune'}
              </span>

              {isAdmin && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleOpenEdit(p)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDelete(p.id)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#FEE2E2', color: '#DC2626', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                    🗑️ Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Ajout / Modif SLA */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Modifier la Règle SLA' : 'Créer une Règle SLA'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Nom de la Politique SLA</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: SLA Premium Entreprise — Intervention 2h" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Niveau de Priorité</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as any)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB' }}>
                <option value="CRITICAL">🔴 Critique (Panne bloquante)</option>
                <option value="HIGH">🟠 Haute (Matériel gérant)</option>
                <option value="STANDARD">🟡 Standard (Atelier)</option>
                <option value="LOW">🟢 Basse (Secondaire)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Délai Max Résolution (Heures)</label>
              <input type="number" required value={targetHours} onChange={(e) => setTargetHours(Number(e.target.value))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Description & Engagements</label>
            <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Préciser les modalités de diagnostic et de résolution..." style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Pénalité Forfaitaire par Jour de Retard (XOF)</label>
            <input type="number" value={penaltyPerDayXOF} onChange={(e) => setPenaltyPerDayXOF(Number(e.target.value))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB' }} />
          </div>

          <button type="submit" style={{ padding: 12, borderRadius: 8, border: 'none', background: themeColor, color: 'white', fontWeight: 800, cursor: 'pointer', marginTop: 10 }}>
            Enregistrer la Règle SLA ✓
          </button>
        </form>
      </Modal>
    </div>
  );
};
