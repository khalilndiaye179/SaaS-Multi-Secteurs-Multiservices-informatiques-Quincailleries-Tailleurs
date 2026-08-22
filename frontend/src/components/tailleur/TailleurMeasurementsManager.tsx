import React, { useState, useEffect } from 'react';

interface ClientMeasurement {
  id: string;
  clientName: string;
  clientPhone: string;
  beneficiaryName?: string;
  garmentType: string;
  measurements: Record<string, number | string>;
  notes?: string;
  parentMeasurementId?: string | null;
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

  // États hiérarchie familiale
  const [currentParent, setCurrentParent] = useState<ClientMeasurement | null>(null);
  const [familyMembers, setFamilyMembers] = useState<ClientMeasurement[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [parentMeasurementId, setParentMeasurementId] = useState<string | null>(null);

  const [form, setForm] = useState({
    clientName: '',
    clientPhone: '',
    beneficiaryName: '',
    garmentType: 'Boubou 3 Pièces',
    notes: '',
  });

  const [dynamicMeasurements, setDynamicMeasurements] = useState<{name: string, value: string}[]>([
    { name: 'Épaule', value: '' },
    { name: 'Poitrine', value: '' },
    { name: 'Taille', value: '' },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);

  const user = JSON.parse(localStorage.getItem('kpsy_user') || '{}');
  const isAdmin = !user?.roles || user?.roles?.length === 0 || user?.roles?.includes('TENANT_ADMIN') || user?.roles?.includes('ADMIN_TENANT') || user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN');

  const fetchFamilyMembers = async (parentId: string) => {
    setLoadingMembers(true);
    try {
      const token = localStorage.getItem('kpsy_token');
      const res = await fetch(`/api/tailleur/measurements/${parentId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFamilyMembers(data);
      } else {
        setFamilyMembers([]);
      }
    } catch (e) {
      console.error(e);
      setFamilyMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const resetForm = () => {
    setForm({
      clientName: '',
      clientPhone: '',
      beneficiaryName: '',
      garmentType: 'Boubou 3 Pièces',
      notes: '',
    });
    setDynamicMeasurements([
      { name: 'Épaule', value: '' },
      { name: 'Poitrine', value: '' },
      { name: 'Taille', value: '' },
    ]);
  };

  const handleOpenNewModal = () => {
    setEditingId(null);
    setCurrentParent(null);
    setParentMeasurementId(null);
    setFamilyMembers([]);
    resetForm();
    setShowModal(true);
  };

  const handleCreateSubSheet = (parent: ClientMeasurement) => {
    setEditingId(null);
    setCurrentParent(parent);
    setParentMeasurementId(parent.id);
    resetForm();
    setForm((prev) => ({
      ...prev,
      clientName: parent.clientName,
      clientPhone: parent.clientPhone,
    }));
    setShowModal(true);
  };

  const handleEdit = (m: ClientMeasurement) => {
    setEditingId(m.id);
    setParentMeasurementId(m.parentMeasurementId || null);

    const ms = (m.measurements || {}) as Record<string, any>;
    setForm({
      clientName: m.clientName,
      clientPhone: m.clientPhone,
      beneficiaryName: m.beneficiaryName || '',
      garmentType: m.garmentType,
      notes: m.notes || '',
    });

    // Transformer le dictionnaire en tableau de {name, value}
    const dynamicArray = Object.keys(ms).map((k) => ({
      name: k,
      value: String(ms[k])
    }));
    if (dynamicArray.length === 0) {
      dynamicArray.push({ name: 'Épaule', value: '' }, { name: 'Poitrine', value: '' }, { name: 'Taille', value: '' });
    }
    setDynamicMeasurements(dynamicArray);

    if (!m.parentMeasurementId) {
      fetchFamilyMembers(m.id);
    } else {
      setFamilyMembers([]);
    }
    setShowModal(true);
  };

  const handleDelete = async (m: ClientMeasurement) => {
    if (!isAdmin) {
      alert('Action réservée exclusivement à l\'Administrateur de l\'établissement.');
      return;
    }

    let confirmMsg = '⚠️ SUPPRESSION : Voulez-vous vraiment supprimer cette fiche de mensurations ?';

    if (!m.parentMeasurementId) {
      try {
        const token = localStorage.getItem('kpsy_token');
        const res = await fetch(`/api/tailleur/measurements/${m.id}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const membersData: ClientMeasurement[] = await res.json();
          if (membersData.length > 0) {
            confirmMsg = `⚠️ SUPPRESSION EN CASCADE : Cette fiche a ${membersData.length} membre(s) rattaché(s) qui seront également supprimés. Continuer ?`;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (!window.confirm(confirmMsg)) return;

    try {
      const token = localStorage.getItem('kpsy_token');
      const res = await fetch(`/api/tailleur/measurements/${m.id}/delete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        if (showModal) setShowModal(false);
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
      dynamicMeasurements.forEach((dm) => {
        if (dm.name.trim() !== '') {
          payloadMeasurements[dm.name.trim()] = dm.value;
        }
      });

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
          parentMeasurementId: parentMeasurementId || undefined,
          measurements: payloadMeasurements,
          notes: form.notes,
        }),
      });

      if (res.ok) {
        if (currentParent) {
          fetchFamilyMembers(currentParent.id);
          handleEdit(currentParent);
        } else {
          setShowModal(false);
          setEditingId(null);
          setParentMeasurementId(null);
          setCurrentParent(null);
          resetForm();
          fetchMeasurements();
        }
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Erreur lors de l\'enregistrement de la fiche.');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: 20, borderRadius: 14, border: '1px solid var(--border-color)' }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: 'var(--text-main)' }}>
            📐 Carnet de Mesures Clients
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Gestion des fiches de mensurations sur-mesure pour les confections couture
          </p>
        </div>
        <button
          onClick={handleOpenNewModal}
          style={{
            background: themeColor,
            color: 'var(--text-inverse)',
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
      <div style={{ background: 'var(--bg-card)', padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border-color)' }}>
        <input
          type="text"
          placeholder="Rechercher par nom de client, téléphone ou modèle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid var(--border-color)',
            fontSize: '0.88rem',
            outline: 'none',
          }}
        />
      </div>

      {/* Grille des Fiches de Mesures Principales (Tuteurs) */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des mensurations...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
          Aucune fiche de mesure enregistrée pour le moment.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map((m) => (
            <div
              key={m.id}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 14,
                border: '1px solid var(--border-color)',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {m.clientName}
                  </h3>
                  {m.beneficiaryName && (
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6B21A8', marginTop: 1 }}>
                      👤 Libellé : {m.beneficiaryName}
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
                    onClick={() => handleCreateSubSheet(m)}
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
              <div style={{ background: 'var(--bg-main)', padding: 12, borderRadius: 10, border: '1px solid #F3F4F6' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Mensurations (cm)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {typeof m.measurements === 'object' && m.measurements !== null ? (
                    Object.entries(m.measurements).map(([k, v]) => (
                      <div key={k} style={{ background: 'var(--bg-card)', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k}</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>{String(v)} cm</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Format non pris en charge</div>
                  )}
                </div>
              </div>

              {m.notes && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: '#FFFBEB', padding: '8px 12px', borderRadius: 8, border: '1px solid #FDE68A' }}>
                  📌 {m.notes}
                </div>
              )}

              {/* Aperçu des membres de la famille s'il y en a */}
              {m.members && m.members.length > 0 && (
                <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                    👨‍👩‍👧‍👦 Membres Rattachés ({m.members.length}) :
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {m.members.map((mem) => (
                      <div
                        key={mem.id}
                        style={{
                          fontSize: '0.76rem',
                          color: '#6B21A8',
                          fontWeight: 700,
                          display: 'flex',
                          justify: 'space-between',
                          alignItems: 'center',
                          padding: '3px 6px',
                          borderRadius: 4,
                          background: 'var(--bg-card)',
                          border: '1px solid #F1F5F9',
                        }}
                      >
                        <span>👤 {mem.beneficiaryName || 'Membre'} ({mem.garmentType})</span>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span
                            onClick={() => {
                              setCurrentParent(m);
                              handleEdit(mem);
                            }}
                            style={{ fontSize: '0.7rem', color: themeColor, fontWeight: 800, cursor: 'pointer' }}
                          >
                            👁️ Voir ➔
                          </span>
                          {isAdmin && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handleDelete(mem);
                              }}
                              style={{
                                fontSize: '0.68rem',
                                color: '#DC2626',
                                background: '#FEE2E2',
                                border: 'none',
                                padding: '2px 5px',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontWeight: 700,
                              }}
                              title="Supprimer ce membre"
                            >
                              🗑️ Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Barre d'action Visualisation Membres / Modifier / Supprimer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: '1px solid #F3F4F6' }}>
                <button
                  onClick={() => handleEdit(m)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid #E9D5FF',
                    background: '#F3E8FF',
                    color: '#6B21A8',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title="Visualiser et gérer les membres rattachés"
                >
                  👨‍👩‍👧‍👦 Membres ({m.members?.length || 0})
                </button>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleEdit(m)}
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
                      onClick={() => handleDelete(m)}
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
            </div>
          ))}
        </div>
      )}

      {/* Modal Fiche de Mesure avec Gestion Familiale */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', borderRadius: 16, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            {/* Fil d'Ariane si on est dans la sous-fiche d'un membre */}
            {currentParent ? (
              <div style={{ background: '#F3E8FF', border: '1px solid #E9D5FF', padding: '10px 14px', borderRadius: 10, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#6B21A8', fontWeight: 700 }}>
                  📐 Tuteur : <strong>{currentParent.clientName}</strong> ➔ Membre : <strong>{form.beneficiaryName || 'Nouveau membre'}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const parent = currentParent;
                    setCurrentParent(null);
                    setParentMeasurementId(null);
                    handleEdit(parent);
                  }}
                  style={{
                    background: '#6B21A8',
                    color: 'var(--text-inverse)',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ← Retour au Tuteur
                </button>
              </div>
            ) : (
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {editingId ? 'Modifier la Fiche Client Tuteur' : 'Nouvelle Fiche de Mesure Client'}
              </h3>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {currentParent ? 'Nom du Chef de Famille / Tuteur (Hérité)' : 'Nom du Chef de Famille / Client Responsable *'}
                </label>
                <input
                  type="text"
                  required
                  readOnly={!!currentParent}
                  placeholder="ex: Mamadou Ndiaye (Père)"
                  value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    marginTop: 4,
                    background: currentParent ? '#F9FAFB' : 'white',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {currentParent ? 'Lien de Parenté / Nom du Membre * (ex: Fils Moussa, Épouse Awa)' : 'Libellé / Bénéficiaire (Optionnel pour le tuteur)'}
                </label>
                <input
                  type="text"
                  required={!!currentParent}
                  placeholder="ex: Fils (Moussa), Épouse (Fatou), Fille (Awa)..."
                  value={form.beneficiaryName}
                  onChange={(e) => setForm({ ...form, beneficiaryName: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', marginTop: 4 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Téléphone *</label>
                  <input
                    type="text"
                    required
                    readOnly={!!currentParent}
                    value={form.clientPhone}
                    onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border-color)',
                      marginTop: 4,
                      background: currentParent ? '#F9FAFB' : 'white',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Type de Vêtement *</label>
                  <input
                    type="text"
                    required
                    value={form.garmentType}
                    onChange={(e) => setForm({ ...form, garmentType: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', marginTop: 4 }}
                  />
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: 4 }}>Mensurations Propres au Sujet (cm)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {dynamicMeasurements.map((dm, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Nom (ex: Épaule)"
                      value={dm.name}
                      onChange={(e) => {
                        const newArr = [...dynamicMeasurements];
                        newArr[idx].name = e.target.value;
                        setDynamicMeasurements(newArr);
                      }}
                      style={{ fontSize: '0.68rem', color: 'var(--text-muted)', width: '100%', border: 'none', background: 'transparent', outline: 'none', padding: '0 2px', marginBottom: 2, fontWeight: 700 }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="text"
                        placeholder="Valeur"
                        value={dm.value}
                        onChange={(e) => {
                          const newArr = [...dynamicMeasurements];
                          newArr[idx].value = e.target.value;
                          setDynamicMeasurements(newArr);
                        }}
                        style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid var(--border-color)' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newArr = dynamicMeasurements.filter((_, i) => i !== idx);
                          setDynamicMeasurements(newArr);
                        }}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}
                        title="Supprimer cette mesure"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setDynamicMeasurements([...dynamicMeasurements, { name: '', value: '' }])}
                style={{
                  alignSelf: 'flex-start',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: themeColor,
                  background: '#F3E8FF',
                  border: `1px solid ${themeColor}40`,
                  padding: '4px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  marginTop: -4
                }}
              >
                + Ajouter une mesure personnalisée
              </button>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Notes & Instructions Tissu</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', marginTop: 4, fontSize: '0.85rem' }}
                />
              </div>

              {/* Section Membres de la famille (Affichée uniquement sur la fiche d'un Tuteur en mode édition) */}
              {editingId && !parentMeasurementId && !currentParent && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      👨‍👩‍👧‍👦 Membres de la Famille Rattachés ({familyMembers.length})
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const rootParent = measurements.find((x) => x.id === editingId);
                        if (rootParent) handleCreateSubSheet(rootParent);
                      }}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: themeColor,
                        background: '#F3E8FF',
                        border: `1px solid ${themeColor}40`,
                        padding: '4px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      + Ajouter un membre
                    </button>
                  </div>

                  {loadingMembers ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chargement des membres...</div>
                  ) : familyMembers.length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Aucun membre rattaché à ce tuteur pour le moment.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                      {familyMembers.map((mem) => (
                        <div
                          key={mem.id}
                          style={{
                            display: 'flex',
                            justify: 'space-between',
                            alignItems: 'center',
                            background: 'var(--bg-main)',
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>{mem.beneficiaryName || 'Membre sans nom'}</strong>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Modèle : {mem.garmentType}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => {
                                const rootParent = measurements.find((x) => x.id === editingId);
                                if (rootParent) setCurrentParent(rootParent);
                                handleEdit(mem);
                              }}
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: '#6B21A8',
                                background: 'var(--bg-card)',
                                border: '1px solid #E9D5FF',
                                padding: '3px 8px',
                                borderRadius: 6,
                                cursor: 'pointer',
                              }}
                            >
                              👁️ Ouvrir Fiche
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await handleDelete(mem);
                                  if (editingId) fetchFamilyMembers(editingId);
                                }}
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  color: '#DC2626',
                                  background: '#FEE2E2',
                                  border: 'none',
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                }}
                                title="Supprimer ce membre"
                              >
                                🗑️ Supprimer
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: themeColor, color: 'var(--text-inverse)', cursor: 'pointer', fontWeight: 700 }}
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

