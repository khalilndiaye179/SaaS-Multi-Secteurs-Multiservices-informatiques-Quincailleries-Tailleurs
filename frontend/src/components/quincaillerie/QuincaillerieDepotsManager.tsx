import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface Depot {
  id: string;
  name: string;
  address?: string;
  isMain: boolean;
}

export default function QuincaillerieDepotsManager() {
  const [depots, setDepots] = useState<Depot[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Overlays
  const [showModal, setShowModal] = useState(false);
  const [editingDepot, setEditingDepot] = useState<Depot | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Custom Toast Notification System
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    isMain: false,
  });

  useEffect(() => {
    fetchDepots();
  }, []);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDepots = async () => {
    try {
      setLoading(true);
      const data = await api.get('/quincaillerie/depots');
      setDepots(data);
    } catch (error: any) {
      triggerToast('Erreur lors du chargement des dépôts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      triggerToast('Le nom du dépôt est requis', 'error');
      return;
    }
    try {
      if (editingDepot) {
        await api.put(`/quincaillerie/depots/${editingDepot.id}`, formData);
        triggerToast('Dépôt mis à jour avec succès !');
      } else {
        await api.post('/quincaillerie/depots', formData);
        triggerToast('Nouveau dépôt créé avec succès !');
      }
      setShowModal(false);
      fetchDepots();
    } catch (error: any) {
      triggerToast(error.response?.data?.message || 'Erreur lors de l\'enregistrement', 'error');
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/quincaillerie/depots/${deleteConfirmId}`);
      triggerToast('Dépôt supprimé avec succès !');
      setDeleteConfirmId(null);
      fetchDepots();
    } catch (error: any) {
      triggerToast('Impossible de supprimer ce dépôt car il contient du stock actif.', 'error');
      setDeleteConfirmId(null);
    }
  };

  const openModal = (depot?: Depot) => {
    if (depot) {
      setEditingDepot(depot);
      setFormData({
        name: depot.name,
        address: depot.address || '',
        isMain: depot.isMain,
      });
    } else {
      setEditingDepot(null);
      setFormData({
        name: '',
        address: '',
        isMain: depots.length === 0, // le premier est principal par défaut
      });
    }
    setShowModal(true);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: '#4F46E5', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 600 }}>Chargement des entrepôts...</span>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { to { transform: rotate(360deg); } }`}} />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Outfit', 'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: toast.type === 'success' ? '#10B981' : '#EF4444',
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
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes slideIn {
              from { transform: translateY(-20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}} />
        </div>
      )}

      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>🏢 Gestion Multi-Dépôts</h2>
          <p style={{ color: '#64748B', fontSize: '0.88rem', margin: '4px 0 0 0' }}>Supervisez vos entrepôts, boutiques et flux de stocks sectoriels.</p>
        </div>
        <button
          onClick={() => openModal()}
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: 12,
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.3)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(79, 70, 229, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(79, 70, 229, 0.3)';
          }}
        >
          <span>➕</span> Nouveau Dépôt
        </button>
      </div>

      {/* Cards list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {depots.map((depot) => (
          <div
            key={depot.id}
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E2E8F0',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#C7D2FE';
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
            }}
          >
            {depot.isMain && (
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: 'white',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: '0 0 0 12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                ⭐ PRINCIPAL
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginTop: depot.isMain ? 10 : 0 }}>
              <div style={{
                background: '#EEF2FF',
                color: '#4F46E5',
                width: 48,
                height: 48,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem'
              }}>
                🏬
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E293B', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {depot.name}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  📍 {depot.address || 'Aucune adresse renseignée'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
              <button
                onClick={() => openModal(depot)}
                style={{
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3B82F6';
                  e.currentTarget.style.color = '#3B82F6';
                  e.currentTarget.style.backgroundColor = '#EFF6FF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.color = '#475569';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                ✏️ Modifier
              </button>
              <button
                onClick={() => setDeleteConfirmId(depot.id)}
                style={{
                  border: '1px solid #FCA5A5',
                  background: '#FFFFFF',
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#DC2626',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FEF2F2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                🗑️ Supprimer
              </button>
            </div>
          </div>
        ))}

        {depots.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            padding: '48px 24px',
            textAlign: 'center',
            background: '#FFFFFF',
            borderRadius: 16,
            border: '2px dashed #CBD5E1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
          }}>
            <span style={{ fontSize: '3rem' }}>🏢</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Aucun dépôt configuré</h3>
            <p style={{ color: '#64748B', fontSize: '0.88rem', margin: 0, maxWidth: 380 }}>Créez votre premier point de vente ou dépôt de stockage pour commencer à y allouer du stock.</p>
            <button
              onClick={() => openModal()}
              style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', marginTop: 8 }}
            >
              + Créer un dépôt maintenant
            </button>
          </div>
        )}
      </div>

      {/* ─── MODAL ADD/EDIT (MODERNE & GLASSMORPHIC) ─── */}
      {showModal && (
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
            maxWidth: 460,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.7)',
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
              padding: '24px 28px',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                {editingDepot ? '✏️ Modifier le dépôt' : '🏢 Nouveau dépôt'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '1.5rem', cursor: 'pointer', outline: 'none' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', tracking: '0.05em' }}>Nom du dépôt *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: 10,
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Ex: Entrepôt Route de Rufisque"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', tracking: '0.05em' }}>Adresse physique</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: 10,
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Ex: Km 12, Boulevard Centenaire"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', padding: 14, borderRadius: 10, border: '1px solid #E2E8F0', cursor: 'pointer' }} onClick={() => setFormData({ ...formData, isMain: !formData.isMain })}>
                <input
                  type="checkbox"
                  id="isMainInput"
                  checked={formData.isMain}
                  onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
                  style={{
                    width: 18,
                    height: 18,
                    cursor: 'pointer',
                    accentColor: '#4F46E5'
                  }}
                />
                <label htmlFor="isMainInput" style={{ marginLeft: 10, fontSize: '0.88rem', fontWeight: 700, color: '#1E293B', cursor: 'pointer' }}>
                  Définir comme dépôt principal (Boutique)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#64748B',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)'
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL CONFIRMATION SUPPRESSION PERSO (MODERNE) ─── */}
      {deleteConfirmId && (
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
            maxWidth: 400,
            padding: 28,
            textAlign: 'center',
            animation: 'scaleUp 0.2s ease-out'
          }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: 16 }}>⚠️</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: '0 0 10px 0' }}>Confirmer la suppression ?</h3>
            <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              Cette opération supprimera définitivement le dépôt. Si des stocks sont alloués dans ce dépôt, la suppression sera refusée pour protéger l'inventaire.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #E2E8F0', background: 'white', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={executeDelete}
                style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#DC2626', color: 'white', fontWeight: 700, cursor: 'pointer' }}
              >
                Oui, Supprimer 🗑️
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
