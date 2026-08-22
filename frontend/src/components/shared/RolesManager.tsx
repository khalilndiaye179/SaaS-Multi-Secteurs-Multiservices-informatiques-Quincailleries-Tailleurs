import React, { useState, useEffect } from 'react';
import { TenantRbacApiService, RoleData, PermissionData } from '../../services/tenant-rbac.service';
import { Modal } from './Modal';

interface Props {
  themeColor?: string;
}

export const RolesManager: React.FC<Props> = ({ themeColor = '#2563EB' }) => {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [permissions, setPermissions] = useState<PermissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', selectedPermissions: [] as string[] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesData, permsData] = await Promise.all([
        TenantRbacApiService.getRoles(),
        TenantRbacApiService.getPermissions()
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement des rôles.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (role?: RoleData) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || '',
        selectedPermissions: role.rolePermissions.map(rp => rp.permission.code)
      });
    } else {
      setEditingRole(null);
      setFormData({ name: '', description: '', selectedPermissions: [] });
    }
    setIsModalOpen(true);
  };

  const handleTogglePermission = (code: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPermissions: prev.selectedPermissions.includes(code)
        ? prev.selectedPermissions.filter(p => p !== code)
        : [...prev.selectedPermissions, code]
    }));
  };

  const handleSave = async () => {
    try {
      if (editingRole) {
        await TenantRbacApiService.updateRole(editingRole.id, {
          name: formData.name,
          description: formData.description,
          permissions: formData.selectedPermissions
        });
      } else {
        await TenantRbacApiService.createRole({
          name: formData.name,
          description: formData.description,
          permissions: formData.selectedPermissions
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Erreur de sauvegarde');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce rôle ?')) return;
    try {
      await TenantRbacApiService.deleteRole(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Impossible de supprimer ce rôle');
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des rôles...</div>;

  return (
    <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: 0 }}>🛡️ Rôles & Permissions</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0' }}>Gérez les accès de vos collaborateurs (RBAC)</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          style={{
            padding: '10px 16px', background: themeColor, color: 'var(--text-inverse)',
            border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer'
          }}
        >
          + Créer un Rôle
        </button>
      </div>

      {error && <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {roles.map(role => (
          <div key={role.id} style={{ border: '1px solid var(--border-color)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-main)', fontWeight: 600 }}>{role.name}</h3>
                <p style={{ margin: '4px 0 12px', fontSize: 13, color: 'var(--text-muted)' }}>{role.description || 'Aucune description'}</p>
              </div>
              <span style={{ background: 'var(--bg-main)', padding: '2px 8px', borderRadius: 12, fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                {role._count?.userRoles || 0} employé(s)
              </span>
            </div>
            
            <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {role.rolePermissions.slice(0, 5).map(rp => (
                <span key={rp.permissionId} style={{ background: '#E0E7FF', color: '#3730A3', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>
                  {rp.permission.code}
                </span>
              ))}
              {role.rolePermissions.length > 5 && (
                <span style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>
                  +{role.rolePermissions.length - 5}
                </span>
              )}
              {role.rolePermissions.length === 0 && (
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Aucune permission</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
              <button
                onClick={() => handleOpenModal(role)}
                style={{ flex: 1, padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
              >
                Modifier
              </button>
              {role.name !== 'ADMIN_TENANT' && role.name !== 'EMPLOYEE' && (
                <button
                  onClick={() => handleDelete(role.id)}
                  style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, color: '#EF4444', cursor: 'pointer', fontSize: 13 }}
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRole ? 'Modifier le rôle' : 'Créer un rôle'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>Nom du rôle</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8, boxSizing: 'border-box' }}
              placeholder="Ex: Caissier"
              disabled={editingRole?.name === 'ADMIN_TENANT' || editingRole?.name === 'EMPLOYEE'}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8, boxSizing: 'border-box' }}
              placeholder="Description courte..."
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>Permissions accordées</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--bg-main)', padding: 16, borderRadius: 8, maxHeight: 300, overflowY: 'auto' }}>
              {permissions.map(p => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.selectedPermissions.includes(p.code)}
                    onChange={() => handleTogglePermission(p.code)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <span>
                    <strong>{p.code.split(':')[0]}</strong>:{p.code.split(':')[1]}
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>{p.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{ flex: 1, padding: 12, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.name}
              style={{ flex: 1, padding: 12, background: themeColor, border: 'none', borderRadius: 8, color: 'var(--text-inverse)', fontWeight: 600, cursor: formData.name ? 'pointer' : 'not-allowed', opacity: formData.name ? 1 : 0.6 }}
            >
              {editingRole ? 'Mettre à jour' : 'Créer le rôle'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
