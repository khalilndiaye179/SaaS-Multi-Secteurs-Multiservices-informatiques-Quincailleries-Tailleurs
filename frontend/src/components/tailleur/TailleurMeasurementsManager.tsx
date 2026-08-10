import React, { useState, useEffect } from 'react';

interface ClientMeasurement {
  id: string;
  clientName: string;
  clientPhone: string;
  beneficiaryName?: string;
  garmentType: string;
  measurements: Record<string, number | string>;
  notes?: string;
  createdAt?: string;
}

interface Props {
  themeColor: string;
}

export const TailleurMeasurementsManager: React.FC<Props> = ({ themeColor }) => {
  const [measurements, setMeasurements] = useState<ClientMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    clientName: '',
    clientPhone: '',
    beneficiaryName: '',
    garmentType: 'Boubou 3 Pièces',
    notes: '',
    epaule: '',
    poitrine: '',
    taille: '',
    hanche: '',
    cou: '',
    cuisses: '',
    fesses: '',
    longueurBoubou: '',
    longueurManche: '',
    longueurPantalon: '',
    tourBras: '',
  });



  const [editingId, setEditingId] = useState<string | null>(null);

  const user = JSON.parse(localStorage.getItem('kpsy_user') || '{}');
  const isAdmin = !user?.roles || user?.roles?.length === 0 || user?.roles?.includes('TENANT_ADMIN') || user?.roles?.includes('ADMIN_TENANT') || user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN');

  const handleEdit = (m: ClientMeasurement) => {
    setEditingId(m.id);
    const ms = (m.measurements || {}) as Record<string, any>;
    setForm({
      clientName: m.clientName,
      clientPhone: m.clientPhone,
      beneficiaryName: m.beneficiaryName || '',
      garmentType: m.garmentType,
      notes: m.notes || '',
      epaule: ms.epaule ? String(ms.epaule) : '',
      poitrine: ms.poitrine ? String(ms.poitrine) : '',
      taille: ms.taille ? String(ms.taille) : '',
      hanche: ms.hanche ? String(ms.hanche) : '',
      cou: ms.cou ? String(ms.cou) : '',
      cuisses: ms.cuisses ? String(ms.cuisses) : '',
      fesses: ms.fesses ? String(ms.fesses) : '',
      longueurBoubou: ms.longueurBoubou ? String(ms.longueurBoubou) : '',
      longueurManche: ms.longueurManche ? String(ms.longueurManche) : '',
      longueurPantalon: ms.longueurPantalon ? String(ms.longueurPantalon) : '',
      tourBras: ms.tourBras ? String(ms.tourBras) : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      alert('Action réservée exclusivement à l\'Administrateur de l\'établissement.');
      return;
    }
    if (!window.confirm('⚠️ SUPPRESSION : Voulez-vous vraiment supprimer cette fiche de mensurations ?')) return;

    try {
      const token = localStorage.getItem('kpsy_token');
      const res = await fetch(`/api/tailleur/measurements/${id}/delete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchMeasurements();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMeasurements = async () => {

    setLoading(true);
    try {
      const token = localStorage.getItem('kpsy_token');
      const res = await fetch('/api/tailleur/measurements', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMeasurements(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeasurements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('kpsy_token');
      const payloadMeasurements: Record<string, string> = {};
      if (form.epaule) payloadMeasurements.epaule = form.epaule;
      if (form.poitrine) payloadMeasurements.poitrine = form.poitrine;
      if (form.taille) payloadMeasurements.taille = form.taille;
      if (form.hanche) payloadMeasurements.hanche = form.hanche;
      if (form.cou) payloadMeasurements.cou = form.cou;
      if (form.cuisses) payloadMeasurements.cuisses = form.cuisses;
      if (form.fesses) payloadMeasurements.fesses = form.fesses;
      if (form.longueurBoubou) payloadMeasurements.longueurBoubou = form.longueurBoubou;
      if (form.longueurManche) payloadMeasurements.longueurManche = form.longueurManche;
      if (form.longueurPantalon) payloadMeasurements.longueurPantalon = form.longueurPantalon;
      if (form.tourBras) payloadMeasurements.tourBras = form.tourBras;

      const url = editingId ? `/api/tailleur/measurements/${editingId}` : '/api/tailleur/measurements';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientName: form.clientName,
          clientPhone: form.clientPhone,
          beneficiaryName: form.beneficiaryName || undefined,
          garmentType: form.garmentType,
          measurements: payloadMeasurements,
          notes: form.notes,
        }),
      });


      if (res.ok) {
        setShowModal(false);
        setEditingId(null);
        setForm({
          clientName: '',
          clientPhone: '',
          beneficiaryName: '',
          garmentType: 'Boubou 3 Pièces',
          notes: '',
          epaule: '',
          poitrine: '',
          taille: '',
          hanche: '',
          cou: '',
          cuisses: '',
          fesses: '',
          longueurBoubou: '',
          longueurManche: '',
          longueurPantalon: '',
          tourBras: '',
        });
        fetchMeasurements();
      }


    } catch (e) {
      console.error(e);
    }
  };

  const filtered = measurements.filter(
    (m) =>
      m.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.clientPhone.includes(searchTerm) ||
      m.garmentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.beneficiaryName && m.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()))
  );


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: 20, borderRadius: 14, border: '1px solid #E5E7EB' }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: '#111827' }}>
            📐 Carnet de Mesures Clients
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#6B7280' }}>
            Gestion des fiches de mensurations sur-mesure pour les confections couture
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: themeColor,
            color: 'white',
            border: 'none',
            padding: '10px 18px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(107, 33, 168, 0.25)',
          }}
        >
          + Nouvelle Fiche Mesure
        </button>
      </div>

      {/* Barre de Recherche */}
      <div style={{ background: 'white', padding: '12px 20px', borderRadius: 12, border: '1px solid #E5E7EB' }}>
        <input
          type="text"
          placeholder="Rechercher par nom de client, téléphone ou modèle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #D1D5DB',
            fontSize: '0.88rem',
            outline: 'none',
          }}
        />
      </div>

      {/* Grille des Fiches de Mesures */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Chargement des mensurations...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', color: '#6B7280' }}>
          Aucune fiche de mesure enregistrée pour le moment.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map((m) => (
            <div
              key={m.id}
              style={{
                background: 'white',
                borderRadius: 14,
                border: '1px solid #E5E7EB',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#111827' }}>
                    {m.clientName}
                  </h3>
                  {m.beneficiaryName && (
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6B21A8', marginTop: 1 }}>
                      👤 Bénéficiaire : {m.beneficiaryName}
                    </div>
                  )}
                  <div style={{ fontSize: '0.8rem', color: themeColor, fontWeight: 700, marginTop: 2 }}>📞 {m.clientPhone}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
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
                    {m.garmentType}
                  </span>
                  <button
                    onClick={() => {
                      setForm({
                        clientName: m.clientName,
                        clientPhone: m.clientPhone,
                        beneficiaryName: '',
                        garmentType: 'Boubou 3 Pièces',
                        notes: '',
                        epaule: '',
                        poitrine: '',
                        taille: '',
                        hanche: '',
                        longueurBoubou: '',
                        longueurManche: '',
                        longueurPantalon: '',
                        tourBras: '',
                      });
                      setShowModal(true);
                    }}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: themeColor,
                      background: 'none',
                      border: `1px solid ${themeColor}40`,
                      padding: '3px 8px',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    + Sous-fiche Membre
                  </button>
                </div>
              </div>



              {/* Conteneur des mesures */}
              <div style={{ background: '#F9FAFB', padding: 12, borderRadius: 10, border: '1px solid #F3F4F6' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: 8 }}>
                  Mensurations (cm)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {typeof m.measurements === 'object' && m.measurements !== null ? (
                    Object.entries(m.measurements).map(([k, v]) => (
                      <div key={k} style={{ background: 'white', padding: '6px 8px', borderRadius: 6, border: '1px solid #E5E7EB' }}>
                        <div style={{ fontSize: '0.68rem', color: '#6B7280', textTransform: 'capitalize' }}>{k}</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827' }}>{String(v)} cm</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Format non pris en charge</div>
                  )}
                </div>
              </div>

              {m.notes && (
                <div style={{ fontSize: '0.78rem', color: '#4B5563', background: '#FFFBEB', padding: '8px 12px', borderRadius: 8, border: '1px solid #FDE68A' }}>
                  📌 {m.notes}
                </div>
              )}

              {/* Barre d'action Modifier / Supprimer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid #F3F4F6' }}>
                <button
                  onClick={() => handleEdit(m)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    background: 'white',
                    color: '#1E293B',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ✏️ Modifier
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(m.id)}
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
      )}


      {/* Modal d'ajout de Mesure */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', width: 500, borderRadius: 16, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>
              Nouvelle Fiche de Mesure Client
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>Nom du Chef de Famille / Client Responsable *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Mamadou Ndiaye (Père)"
                  value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>Membre de la famille / Bénéficiaire (Optionnel)</label>
                <input
                  type="text"
                  placeholder="ex: Fils (Moussa), Épouse (Fatou), Fille (Awa)..."
                  value={form.beneficiaryName}
                  onChange={(e) => setForm({ ...form, beneficiaryName: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', marginTop: 4 }}
                />
              </div>


              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>Téléphone *</label>
                  <input
                    type="text"
                    required
                    value={form.clientPhone}
                    onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', marginTop: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>Type de Vêtement</label>
                  <input
                    type="text"
                    value={form.garmentType}
                    onChange={(e) => setForm({ ...form, garmentType: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', marginTop: 4 }}
                  />
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginTop: 4 }}>Mensurations Principales (cm)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#6B7280' }}>Épaule</span>
                  <input type="number" value={form.epaule} onChange={(e) => setForm({ ...form, epaule: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #D1D5DB' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#6B7280' }}>Poitrine</span>
                  <input type="number" value={form.poitrine} onChange={(e) => setForm({ ...form, poitrine: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #D1D5DB' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#6B7280' }}>Taille</span>
                  <input type="number" value={form.taille} onChange={(e) => setForm({ ...form, taille: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #D1D5DB' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#6B7280' }}>Hanche</span>
                  <input type="number" value={form.hanche} onChange={(e) => setForm({ ...form, hanche: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #D1D5DB' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#6B7280' }}>Tour Cou</span>
                  <input type="number" value={form.cou} onChange={(e) => setForm({ ...form, cou: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #D1D5DB' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#6B7280' }}>Tour Cuisses</span>
                  <input type="number" value={form.cuisses} onChange={(e) => setForm({ ...form, cuisses: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #D1D5DB' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#6B7280' }}>Tour Fesses</span>
                  <input type="number" value={form.fesses} onChange={(e) => setForm({ ...form, fesses: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #D1D5DB' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#6B7280' }}>Long. Boubou</span>
                  <input type="number" value={form.longueurBoubou} onChange={(e) => setForm({ ...form, longueurBoubou: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #D1D5DB' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#6B7280' }}>Long. Manche</span>
                  <input type="number" value={form.longueurManche} onChange={(e) => setForm({ ...form, longueurManche: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #D1D5DB' }} />
                </div>
              </div>


              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>Notes & Instructions Tissu</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', marginTop: 4, fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB', background: 'white', cursor: 'pointer', fontWeight: 600 }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: themeColor, color: 'white', cursor: 'pointer', fontWeight: 700 }}
                >
                  Enregistrer Fiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
