import React, { useState } from 'react';
import { Modal } from '../shared/Modal';

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  estimatedHours: string;
  priceXOF: number;
  category: 'MAINTENANCE' | 'SYSTEM' | 'HARDWARE' | 'NETWORK';
}

interface Props {
  themeColor: string;
}

export const ITPrestationsCatalog: React.FC<Props> = ({ themeColor }) => {
  const user = JSON.parse(localStorage.getItem('kpsy_user') || '{}');
  const isAdmin = !user?.roles || user?.roles?.length === 0 || user?.roles?.includes('TENANT_ADMIN') || user?.roles?.includes('ADMIN_TENANT') || user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN');


  const [services, setServices] = useState<ServiceItem[]>([
    { id: '1', title: 'Formatage & Inst. Windows 11 Pro + Drivers', description: 'Nettoyage disque, installation OS 64-bit, pack bureautique et sécurité', estimatedHours: '2h00', priceXOF: 15000, category: 'SYSTEM' },
    { id: '2', title: 'Déblocage & Flashage Smartphone / Tablette', description: 'Réinitialisation compte Google / FRP, désimlockage réseau', estimatedHours: '1h30', priceXOF: 10000, category: 'SYSTEM' },
    { id: '3', title: 'Remplacement Écran / Dalle Laptop LED 15.6"', description: 'Démontage propre, pose dalle neuve garantie 3 mois', estimatedHours: '1h00', priceXOF: 45000, category: 'HARDWARE' },
    { id: '4', title: 'Dépoussiérage & Changement Pâte Thermique', description: 'Nettoyage ventilateur PC Gamer/Bureau, application pâte Noctua', estimatedHours: '1h30', priceXOF: 12000, category: 'MAINTENANCE' },
    { id: '5', title: 'Récupération Données Disque Dur Endommagé', description: 'Extraction de fichiers sur support RAW / formaté à 80%', estimatedHours: '4h00', priceXOF: 35000, category: 'MAINTENANCE' },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('1h00');
  const [priceXOF, setPriceXOF] = useState(15000);
  const [category, setCategory] = useState<ServiceItem['category']>('MAINTENANCE');

  const handleOpenAdd = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setEstimatedHours('1h00');
    setPriceXOF(15000);
    setCategory('MAINTENANCE');
    setShowModal(true);
  };

  const handleOpenEdit = (s: ServiceItem) => {
    setEditingId(s.id);
    setTitle(s.title);
    setDescription(s.description);
    setEstimatedHours(s.estimatedHours);
    setPriceXOF(s.priceXOF);
    setCategory(s.category);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) {
      alert('Action réservée à l\'Administrateur de l\'établissement.');
      return;
    }
    if (window.confirm('Voulez-vous vraiment supprimer ce forfait du catalogue ?')) {
      setServices(services.filter((s) => s.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setServices(services.map((s) => (s.id === editingId ? { ...s, title, description, estimatedHours, priceXOF, category } : s)));
    } else {
      const newService: ServiceItem = {
        id: Date.now().toString(),
        title,
        description,
        estimatedHours,
        priceXOF,
        category,
      };
      setServices([...services, newService]);
    }
    setShowModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: 'var(--text-main)' }}>
            Catalogue des Forfaits & Prestations IT ({services.length})
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Grille tarifaire standard des réparations informatiques et interventions d'atelier
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
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
            + Ajouter un Forfait IT
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {services.map((s) => (
          <div key={s.id} style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 12, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ padding: '3px 8px', borderRadius: 6, background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700 }}>
                  {s.category}
                </span>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: themeColor, fontFamily: "'Sora', sans-serif" }}>
                  {s.priceXOF.toLocaleString()} XOF
                </span>
              </div>

              <h3 style={{ margin: '0 0 6px 0', fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>{s.title}</h3>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{s.description}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: 10, marginTop: 10 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>⏱️ Durée est. {s.estimatedHours}</span>

              {isAdmin && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleOpenEdit(s)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-card)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                    ✏️ Modifier
                  </button>
                  <button onClick={() => handleDelete(s.id)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#FEE2E2', color: '#DC2626', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                    🗑️ Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Ajout / Modification */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Modifier la Prestation IT' : 'Ajouter une Prestation IT'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Titre du Forfait</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex: Nettoyage Système & Antivirus" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Description Détallée</label>
            <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Détail des opérations effectuées..." style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Prix de la Prestation (XOF)</label>
              <input type="number" required value={priceXOF} onChange={(e) => setPriceXOF(Number(e.target.value))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Durée Estimée</label>
              <input required value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} placeholder="ex: 1h30" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)' }} />
            </div>
          </div>

          <button type="submit" style={{ padding: 12, borderRadius: 8, border: 'none', background: themeColor, color: 'var(--text-inverse)', fontWeight: 800, cursor: 'pointer', marginTop: 10 }}>
            Enregistrer dans le Catalogue ✓
          </button>
        </form>
      </Modal>
    </div>
  );
};
