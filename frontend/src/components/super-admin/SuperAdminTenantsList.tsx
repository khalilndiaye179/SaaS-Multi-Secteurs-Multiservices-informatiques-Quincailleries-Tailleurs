import React, { useState, useEffect } from 'react';

interface TenantItem {
  id: string;
  name: string;
  code: string;
  sectorType: string;
  country: string;
  billingStatus: 'TRIAL_7D' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'ARCHIVED';
  subscriptionEndsAt?: string;
  createdAt: string;
  phone?: string;
  email?: string;
  users?: Array<{
    id: string;
    fullName: string;
    email: string;
    phone: string;
    username: string;
  }>;
  _count?: {
    users: number;
  };
}

interface Props {
  themeColor: string;
}

export const SuperAdminTenantsList: React.FC<Props> = ({ themeColor }) => {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedContactTenant, setSelectedContactTenant] = useState<TenantItem | null>(null);

  const token = localStorage.getItem('kpsy_token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super-admin/tenants', { headers });
      if (res.ok) setTenants(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleToggleStatus = async (tenantId: string, currentStatus: string) => {
    setProcessingId(tenantId);
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchTenants();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  const [editingTenant, setEditingTenant] = useState<TenantItem | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', phone: '', email: '', country: 'SN' });
  const [softDeletingTenant, setSoftDeletingTenant] = useState<TenantItem | null>(null);
  const [confirmTenantCodeInput, setConfirmTenantCodeInput] = useState('');

  const handleOpenEdit = (t: TenantItem) => {
    setEditingTenant(t);
    setEditFormData({
      name: t.name || '',
      phone: (t as any).phone || '',
      email: (t as any).email || '',
      country: t.country || 'SN',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTenant) return;
    setProcessingId(editingTenant.id);
    try {
      const res = await fetch(`/api/super-admin/tenants/${editingTenant.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editFormData),
      });

      if (res.ok) {
        setEditingTenant(null);
        fetchTenants();
      } else {
        alert('Erreur lors de la mise à jour de l\'entreprise.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleExecuteSoftDelete = async () => {
    if (!softDeletingTenant) return;
    if (confirmTenantCodeInput.trim() !== softDeletingTenant.code) {
      alert(`⚠️ Le code saisi "${confirmTenantCodeInput}" ne correspond pas au code tenant "${softDeletingTenant.code}".`);
      return;
    }

    setProcessingId(softDeletingTenant.id);
    try {
      const res = await fetch(`/api/super-admin/tenants/${softDeletingTenant.id}/soft-delete`, {
        method: 'PUT',
        headers,
      });

      if (res.ok) {
        alert(`✅ L'entreprise ${softDeletingTenant.name} (${softDeletingTenant.code}) a été archivée avec succès.`);
        setSoftDeletingTenant(null);
        setConfirmTenantCodeInput('');
        fetchTenants();
      } else {
        alert('Erreur lors de l\'archivage.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: TenantItem['billingStatus']) => {
    const config: Record<string, { bg: string; color: string; label: string }> = {
      TRIAL_7D: { bg: '#FEF3C7', color: '#92400E', label: 'Essai (7J)' },
      ACTIVE: { bg: '#D1FAE5', color: '#065F46', label: 'Actif' },
      EXPIRED: { bg: '#FEE2E2', color: '#DC2626', label: 'Expiré' },
      SUSPENDED: { bg: '#F3F4F6', color: 'var(--text-muted)', label: 'Suspendu' },
      ARCHIVED: { bg: '#475569', color: 'var(--text-inverse)', label: 'Archivé 🗄️' },
    };
    const c = config[status] || config.TRIAL_7D;
    return (
      <span style={{ padding: '4px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.75rem', background: c.bg, color: c.color }}>
        {c.label}
      </span>
    );
  };

  const handlePurgeTests = async () => {
    if (!window.confirm('⚠️ CONFIRMATION PURGE : Voulez-vous vraiment supprimer définitivement TOUS les tenants d\'essai et conserver uniquement les 3 tenants de démonstration officiels (QNC-0001, ITS-0001, TLR-0001) ?')) return;

    try {
      const res = await fetch('/api/super-admin/tenants/purge-test', {
        method: 'POST',
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        alert(`✅ ${data.message}`);
        fetchTenants();
      }
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la purge.');
    }
  };

  const handleHardPurge = async (tenantId: string, tenantName: string) => {
    const confirmation = window.prompt(
      `⚠️ ATTENTION : Vous allez supprimer DÉFINITIVEMENT le tenant "${tenantName}" ainsi que TOUTES ses données (utilisateurs, factures, stock).\n\nTapez "PURGER" pour confirmer :`
    );

    if (confirmation === 'PURGER') {
      try {
        const res = await fetch(`/api/super-admin/tenants/${tenantId}/hard-delete`, {
          method: 'DELETE',
          headers,
        });

        if (res.ok) {
          const data = await res.json();
          alert(`✅ ${data.message || 'Tenant supprimé.'}`);
          fetchTenants();
        } else {
          const errData = await res.json();
          alert(`❌ Erreur: ${errData.message || 'Impossible de purger ce tenant.'}`);
        }
      } catch (e) {
        console.error(e);
        alert('Erreur lors de la purge définitive.');
      }
    } else if (confirmation !== null) {
      alert('Action annulée : Le mot de passe de confirmation était incorrect.');
    }
  };

  const user = JSON.parse(localStorage.getItem('kpsy_user') || '{}');
  const isSuper = user?.roles?.includes('SUPER_ADMIN');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: 'var(--text-main)' }}>
            Gestion & Actions Individuelles sur les Tenants ({tenants.length})
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Liste exhaustive des comptes d'entreprises inscrites et contrôle des accès SaaS
          </p>
        </div>

        {isSuper && (
          <button
            onClick={handlePurgeTests}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              background: '#DC2626',
              color: 'var(--text-inverse)',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
            }}
          >
            🧹 Purger Tous les Tenants Tests
          </button>
        )}
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des entreprises...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Nom Entreprise</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Code Tenant</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Secteur</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Pays</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Statut Abonnement</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Utilisateurs</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Aucune entreprise inscrite.
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700 }}>{t.name}</td>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: themeColor }}>{t.code}</td>
                    <td style={{ padding: '14px 18px' }}>{t.sectorType}</td>
                    <td style={{ padding: '14px 18px', fontWeight: 700 }}>{t.country}</td>
                    <td style={{ padding: '14px 18px' }}>{getStatusBadge(t.billingStatus)}</td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{t._count?.users || 1} admin</td>
                    <td style={{ padding: '14px 18px', display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        onClick={() => setSelectedContactTenant(t)}
                        title="Voir les coordonnées du gérant"
                        style={{
                          padding: '6px 10px', borderRadius: 6, background: '#F0FDF4',
                          color: '#166534', border: '1px solid #BBF7D0', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        📞 Contact
                      </button>

                      {isSuper && (
                        <>
                          <button
                            onClick={() => handleHardPurge(t.id, t.name)}
                            title="Purger définitivement ce tenant"
                            style={{
                              padding: '6px 10px', borderRadius: 6, background: '#FEE2E2',
                              color: '#DC2626', border: '1px solid #FCA5A5', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                            }}
                          >
                            🗑️ Purger
                          </button>

                          <button
                            onClick={() => handleOpenEdit(t)}
                            title="Modifier l'entreprise"
                            style={{
                              padding: '6px 10px', borderRadius: 6, background: '#E0F2FE',
                              color: '#0369A1', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                            }}
                          >
                            ✏️ Edit
                          </button>

                          <button
                            disabled={processingId === t.id || t.billingStatus === 'ARCHIVED'}
                            onClick={() => handleToggleStatus(t.id, t.billingStatus)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 6,
                              background: t.billingStatus === 'ACTIVE' ? '#FEF3C7' : '#D1FAE5',
                              color: t.billingStatus === 'ACTIVE' ? '#92400E' : '#065F46',
                              border: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: t.billingStatus === 'ARCHIVED' ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {processingId === t.id ? '...' : t.billingStatus === 'ACTIVE' ? 'Suspendre' : 'Activer'}
                          </button>

                          {t.billingStatus !== 'ARCHIVED' && (
                            <button
                              onClick={() => setSoftDeletingTenant(t)}
                              title="Archiver l'entreprise (Soft Delete)"
                              style={{
                                padding: '6px 10px', borderRadius: 6, background: '#FEE2E2',
                                color: '#DC2626', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                              }}
                            >
                              🗑️ Archiver
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── MODAL MODIFIER TENANT ─── */}
      {editingTenant && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{ background: 'var(--bg-card)', padding: 28, borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 4px 0', fontFamily: "'Sora', sans-serif", fontWeight: 800 }}>✏️ Modifier les Coordonnées de l'Entreprise</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Code Tenant : <strong style={{ color: themeColor }}>{editingTenant.code}</strong> (Secteur : {editingTenant.sectorType})
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Nom de l'entreprise</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Téléphone</label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Email</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Pays UEMOA</label>
                <select
                  value={editFormData.country}
                  onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                >
                  <option value="SN">🇸🇳 Sénégal (SN)</option>
                  <option value="CI">🇨🇮 Côte d'Ivoire (CI)</option>
                  <option value="ML">🇲🇱 Mali (ML)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => setEditingTenant(null)} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', fontWeight: 700, cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={handleSaveEdit} style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: themeColor, color: 'var(--text-inverse)', fontWeight: 800, cursor: 'pointer' }}>
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL CONFIRMATION SUPPRESSION LOGIQUE (SOFT DELETE) ─── */}
      {softDeletingTenant && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{ background: 'var(--bg-card)', padding: 28, borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontFamily: "'Sora', sans-serif", fontWeight: 800, color: '#DC2626' }}>
              ⚠️ Confirmation d'Archivage (Soft Delete)
            </h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Vous êtes sur le point d'archiver le tenant <strong>{softDeletingTenant.name}</strong> (Code : <strong style={{ color: themeColor }}>{softDeletingTenant.code}</strong>).
            </p>
            <div style={{ padding: 12, background: '#FEF2F2', borderRadius: 8, border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '0.78rem', marginBottom: 14 }}>
              <strong>🔒 Effets de l'archivage :</strong>
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                <li>Accès API et connexions utilisateurs immédiatement bloqués (`ForbiddenException`).</li>
                <li>Données historiques conservées en base sans perte comptable.</li>
              </ul>
            </div>

            <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Veuillez saisir le code tenant <strong style={{ color: '#DC2626' }}>{softDeletingTenant.code}</strong> pour confirmer :
            </label>
            <input
              type="text"
              placeholder={`Tapez ${softDeletingTenant.code}`}
              value={confirmTenantCodeInput}
              onChange={(e) => setConfirmTenantCodeInput(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #FCA5A5', fontSize: '0.88rem', fontWeight: 700 }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => { setSoftDeletingTenant(null); setConfirmTenantCodeInput(''); }}
                style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', fontWeight: 700, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                disabled={confirmTenantCodeInput.trim() !== softDeletingTenant.code}
                onClick={handleExecuteSoftDelete}
                style={{
                  padding: '9px 16px', borderRadius: 8, border: 'none',
                  background: confirmTenantCodeInput.trim() === softDeletingTenant.code ? '#DC2626' : '#9CA3AF',
                  color: 'var(--text-inverse)', fontWeight: 800, cursor: confirmTenantCodeInput.trim() === softDeletingTenant.code ? 'pointer' : 'not-allowed',
                }}
              >
                Confirmer l'Archivage 🗑️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL COORDONNÉES TENANT / GÉRANT ─── */}
      {selectedContactTenant && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20,
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 500,
            padding: 28, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: themeColor, textTransform: 'uppercase' }}>
                  {selectedContactTenant.code}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {selectedContactTenant.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedContactTenant(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--bg-main)', padding: 18, borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Nom du Gérant</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  👤 {selectedContactTenant.users?.[0]?.fullName || 'Non renseigné'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Téléphone</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    📞 {selectedContactTenant.phone || selectedContactTenant.users?.[0]?.phone || 'Non renseigné'}
                  </span>
                  {(selectedContactTenant.phone || selectedContactTenant.users?.[0]?.phone) && (
                    <a
                      href={`tel:${selectedContactTenant.phone || selectedContactTenant.users?.[0]?.phone}`}
                      style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, background: '#DCFCE7', padding: '2px 8px', borderRadius: 4, textDecoration: 'none' }}
                    >Appeler</a>
                  )}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>E-mail</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    ✉️ {selectedContactTenant.email || selectedContactTenant.users?.[0]?.email || 'Non renseigné'}
                  </span>
                  {(selectedContactTenant.email || selectedContactTenant.users?.[0]?.email) && (
                    <a
                      href={`mailto:${selectedContactTenant.email || selectedContactTenant.users?.[0]?.email}`}
                      style={{ fontSize: '0.75rem', color: '#1E40AF', fontWeight: 700, background: '#DBEAFE', padding: '2px 8px', borderRadius: 4, textDecoration: 'none' }}
                    >Envoyer e-mail</a>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 6, borderTop: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>PAYS / SECTEUR</span>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {selectedContactTenant.country} | {selectedContactTenant.sectorType}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>IDENTIFIANT ADMIN</span>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: themeColor }}>
                    {selectedContactTenant.users?.[0]?.username || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button
                onClick={() => setSelectedContactTenant(null)}
                style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--bg-main)', color: 'var(--text-muted)', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

