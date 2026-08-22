import React, { useState } from 'react';
import { Modal } from '../shared/Modal';

interface ServiceModel {
  id: string;
  name: string;
  category: string;
  estimatedPrice: number;
  delaysDays: number;
  description?: string;
  fabricRecommendation?: string;
}

interface Props {
  themeColor: string;
}

export const TailleurCatalogManager: React.FC<Props> = ({ themeColor }) => {
  const [services, setServices] = useState<ServiceModel[]>([
    { id: '1', name: 'Grand Boubou 3 Pièces Bazin', category: 'Traditionnel', estimatedPrice: 35000, delaysDays: 5, description: 'Boubou traditionnel complet 3 pièces avec broderies royales au col et aux manches.', fabricRecommendation: 'Bazin Riche Getzner ou Gagnier' },
    { id: '2', name: 'Taille Basse Bazin Brodé', category: 'Femme', estimatedPrice: 25000, delaysDays: 4, description: 'Ensemble taille basse élégant avec découpes ajustées et motifs floraux.', fabricRecommendation: 'Bazin Moyen ou Soie Dentelle' },
    { id: '3', name: 'Costume 2 Pièces Homme', category: 'Moderne', estimatedPrice: 45000, delaysDays: 7, description: 'Veste cintrée européenne et pantalon droit coupe moderne sur-mesure.', fabricRecommendation: 'Laine Super 120s ou Cashmere' },
    { id: '4', name: 'Robe de Mariée / Cérémonie', category: 'Prestige', estimatedPrice: 85000, delaysDays: 10, description: 'Robe d\'exception haute couture avec traîne et perlage fait main.', fabricRecommendation: 'Satin Duchesse & Organza' },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceModel | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    category: 'Traditionnel',
    estimatedPrice: 30000,
    delaysDays: 5,
    description: '',
    fabricRecommendation: '',
  });

  const user = JSON.parse(localStorage.getItem('kpsy_user') || '{}');
  const isAdmin = !user?.roles || user?.roles?.length === 0 || user?.roles?.includes('TENANT_ADMIN') || user?.roles?.includes('ADMIN_TENANT') || user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN');

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      name: '',
      category: 'Traditionnel',
      estimatedPrice: 30000,
      delaysDays: 5,
      description: '',
      fabricRecommendation: '',
    });
    setShowModal(true);
  };

  const handleEdit = (s: ServiceModel) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      category: s.category,
      estimatedPrice: s.estimatedPrice,
      delaysDays: s.delaysDays,
      description: s.description || '',
      fabricRecommendation: s.fabricRecommendation || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) {
      alert('Action réservée exclusivement à l\'Administrateur de l\'atelier.');
      return;
    }
    if (!window.confirm('⚠️ SUPPRESSION : Voulez-vous vraiment supprimer ce modèle du catalogue ?')) return;
    setServices(services.filter((s) => s.id !== id));
  };

  const handleShowDetails = (s: ServiceModel) => {
    setSelectedService(s);
    setShowDetailModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setServices(
        services.map((s) => (s.id === editingId ? { ...s, ...form } : s))
      );
    } else {
      const newModel: ServiceModel = {
        id: String(Date.now()),
        ...form,
      };
      setServices([newModel, ...services]);
    }
    setShowModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header & Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: 'var(--text-main)' }}>
            Catalogue des Modèles & Tarifs Confection ({services.length})
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Grille tarifaire, recommandations tissu et détails d'exécution par type d'ouvrage
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            background: themeColor,
            color: 'var(--text-inverse)',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: `0 4px 12px ${themeColor}30`,
          }}
        >
          + Ajouter un Modèle
        </button>
      </div>

      {/* Grid of Models */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {services.map((s) => (
          <div
            key={s.id}
            style={{
              background: 'var(--bg-card)',
              borderRadius: 14,
              border: '1px solid var(--border-color)',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 14,
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 12,
                    background: '#F3E8FF',
                    color: '#6B21A8',
                  }}
                >
                  {s.category}
                </span>
                <h4 style={{ margin: '8px 0 2px 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>{s.name}</h4>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>⏱️ Délai d'exécution : <strong>{s.delaysDays} jours</strong></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: themeColor, fontFamily: "'Sora', sans-serif" }}>
                  {s.estimatedPrice.toLocaleString()} XOF
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tarif indicatif</div>
              </div>
            </div>

            {s.description && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-main)', padding: '8px 12px', borderRadius: 8, border: '1px solid #F3F4F6' }}>
                💡 {s.description.substring(0, 75)}...
              </div>
            )}

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 10, borderTop: '1px solid #F3F4F6' }}>
              <button
                onClick={() => handleShowDetails(s)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                👁️ Détails
              </button>
              <button
                onClick={() => handleEdit(s)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ✏️ Modifier
              </button>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(s.id)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#FEE2E2',
                    color: '#DC2626',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  title="Suppression réservée à l'Administrateur"
                >
                  🗑️ Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Création / Edition Modèle */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Modifier le Modèle de Confection' : 'Ajouter un Nouveau Modèle au Catalogue'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Nom du Modèle / Vêtement *</label>
            <input
              type="text"
              required
              placeholder="ex: Grand Boubou 3P Bazin Getzner"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', marginTop: 4 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Catégorie</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Tarif (XOF) *</label>
              <input
                type="number"
                required
                value={form.estimatedPrice}
                onChange={(e) => setForm({ ...form, estimatedPrice: Number(e.target.value) })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Délai (Jours)</label>
              <input
                type="number"
                required
                value={form.delaysDays}
                onChange={(e) => setForm({ ...form, delaysDays: Number(e.target.value) })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', marginTop: 4 }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Recommandation Tissu</label>
            <input
              type="text"
              placeholder="ex: Bazin Riche Getzner, Satin Duchesse..."
              value={form.fabricRecommendation}
              onChange={(e) => setForm({ ...form, fabricRecommendation: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', marginTop: 4 }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Description & Détails de Confection</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', marginTop: 4, fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer', fontWeight: 600 }}
            >
              Annuler
            </button>
            <button
              type="submit"
              style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: themeColor, color: 'var(--text-inverse)', cursor: 'pointer', fontWeight: 700 }}
            >
              Enregistrer Modèle
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Détails du Modèle */}
      {selectedService && (
        <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={`Fiche Technique Modèle : ${selectedService.name}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: 14, borderRadius: 10 }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: '#F3E8FF', color: '#6B21A8' }}>
                  {selectedService.category}
                </span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Délai moyen d'exécution : <strong>{selectedService.delaysDays} jours</strong></div>
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: themeColor }}>
                {selectedService.estimatedPrice.toLocaleString()} XOF
              </div>
            </div>

            {selectedService.fabricRecommendation && (
              <div style={{ background: '#FFFBEB', padding: 12, borderRadius: 8, border: '1px solid #FDE68A' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400E' }}>🧵 Tissus Recommandés</div>
                <div style={{ fontSize: '0.85rem', color: '#78350F', marginTop: 2 }}>{selectedService.fabricRecommendation}</div>
              </div>
            )}

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Description & Finitions Atelier</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, background: 'var(--bg-card)', padding: 12, borderRadius: 8, border: '1px solid var(--border-color)' }}>
                {selectedService.description || 'Aucune consigne spécifique enregistrée.'}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

