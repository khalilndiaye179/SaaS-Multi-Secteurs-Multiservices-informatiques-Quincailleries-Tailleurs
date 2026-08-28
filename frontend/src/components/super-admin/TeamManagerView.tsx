import React, { useState, useEffect } from 'react';
import { SuperAdminApiService, TeamCollaboratorData, TeamInvitationData } from '../../services/super-admin-api.service';
import { ForbiddenState } from './ForbiddenState';

interface Props {
  themeColor?: string;
}

export const TeamManagerView: React.FC<Props> = ({ themeColor = '#312E81' }) => {
  const [team, setTeam] = useState<TeamCollaboratorData[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enforce2FA, setEnforce2FA] = useState(false);

  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState('FINANCE');

  // États pour l'édition d'un collaborateur
  const [editingCollab, setEditingCollab] = useState<TeamCollaboratorData | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await SuperAdminApiService.getTeamOverview();
      setTeam(data.team || []);
      setInvitations(data.invitations || []);
      const enforceData = await SuperAdminApiService.getEnforce2fa();
      setEnforce2FA(enforceData.enforce2FA);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de l\'équipe Super Admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invitePassword.length < 8) {
      alert('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    try {
      await SuperAdminApiService.createCollaborator({ 
        fullName: inviteFullName,
        email: inviteEmail, 
        phone: invitePhone, 
        password: invitePassword,
        roleName: inviteRole 
      });
      alert(`Collaborateur créé avec succès !\nUn email lui a été envoyé.`);
      setInviteFullName('');
      setInviteEmail('');
      setInvitePhone('');
      setInvitePassword('');
      fetchTeam();
    } catch (err: any) {
      alert(`Échec de la création : ${err.message}`);
    }
  };

  const handleToggleStatus = async (userId: string, currentActive: boolean) => {
    try {
      await SuperAdminApiService.toggleCollaboratorStatus(userId, !currentActive);
      fetchTeam();
    } catch (err: any) {
      alert(`Échec : ${err.message}`);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (window.confirm(`Confirmez-vous le changement de rôle vers ${newRole} ?`)) {
      try {
        await SuperAdminApiService.updateCollaboratorRole(userId, newRole);
        fetchTeam();
      } catch (err: any) {
        alert(`Échec : ${err.message}`);
      }
    }
  };

  const handleToggleEnforce2FA = async () => {
    if (window.confirm(`Voulez-vous vraiment ${enforce2FA ? 'désactiver' : 'ACTIVER'} l'obligation du 2FA pour tous les collaborateurs ?`)) {
      try {
        await SuperAdminApiService.setEnforce2fa(!enforce2FA);
        setEnforce2FA(!enforce2FA);
      } catch (err: any) {
        alert(`Échec : ${err.message}`);
      }
    }
  };

  const handleDisable2FA = async (userId: string) => {
    if (window.confirm("URGENCE: Êtes-vous sûr de vouloir désactiver le 2FA pour ce collaborateur ? Il devra le reconfigurer à sa prochaine connexion.")) {
      try {
        await SuperAdminApiService.disableCollaborator2FA(userId);
        fetchTeam();
      } catch (err: any) {
        alert(`Échec : ${err.message}`);
      }
    }
  };

  const handleDelete = async (userId: string, fullName: string) => {
    if (window.confirm(`⚠️ DANGER : Voulez-vous vraiment SUPPRIMER définitivement le collaborateur "${fullName}" ?\n\nCette action supprimera également toutes ses relations et est irréversible.`)) {
      try {
        await SuperAdminApiService.deleteCollaborator(userId);
        alert('Collaborateur supprimé avec succès.');
        fetchTeam();
      } catch (err: any) {
        alert(`Échec de la suppression : ${err.message}`);
      }
    }
  };

  const handleResetPassword = async (userId: string, fullName: string) => {
    if (window.confirm(`🔑 Réinitialiser les accès : Voulez-vous générer un nouveau mot de passe temporaire pour "${fullName}" ?`)) {
      try {
        const res = await SuperAdminApiService.resetCollaboratorPassword(userId);
        alert(`✅ Succès !\n\nNouveau mot de passe temporaire : ${res.newPassword}\n\nVeuillez le copier et le transmettre de manière sécurisée au collaborateur. Il devra le modifier à sa prochaine connexion.`);
        fetchTeam();
      } catch (err: any) {
        alert(`Échec de la réinitialisation : ${err.message}`);
      }
    }
  };

  const handleOpenEdit = (collab: TeamCollaboratorData) => {
    setEditingCollab(collab);
    setEditFullName(collab.fullName);
    setEditEmail(collab.email);
    setEditPhone(collab.phone || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollab) return;
    try {
      await SuperAdminApiService.updateCollaborator(editingCollab.id, {
        fullName: editFullName,
        email: editEmail,
        phone: editPhone,
      });
      alert('Collaborateur mis à jour avec succès.');
      setEditingCollab(null);
      fetchTeam();
    } catch (err: any) {
      alert(`Échec de la mise à jour : ${err.message}`);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des collaborateurs...</div>;
  if (error?.includes('403')) return <ForbiddenState message="Seul le rôle SUPER_ADMIN is autorisé à gérer l'équipe d'administration." />;

  const currentUser = JSON.parse(localStorage.getItem('kpsy_user') || '{}');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>👥 Collaborateurs & RBAC Granulaire</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Gestion de l'équipe Super Admin et protection du dernier SUPER_ADMIN</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)', padding: '12px 20px', borderRadius: 10, border: '1px solid var(--border-color)' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Obligation 2FA (Globale)</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Force le 2FA pour toute l'équipe</div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
            <input type="checkbox" checked={enforce2FA} onChange={handleToggleEnforce2FA} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: enforce2FA ? themeColor : '#ccc', transition: '.4s', borderRadius: 24 }}>
              <span style={{ position: 'absolute', content: '""', height: 18, width: 18, left: enforce2FA ? 22 : 3, bottom: 3, backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }} />
            </span>
          </label>
        </div>
      </div>

      {/* Formulaire de création */}
      <form onSubmit={handleCreate} style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)', display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Prénom & Nom</label>
          <input
            type="text"
            required
            value={inviteFullName}
            onChange={(e) => setInviteFullName(e.target.value)}
            placeholder="John Doe"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 14 }}
          />
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Email</label>
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="collaborateur@doorwaar.sn"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 14 }}
          />
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Téléphone</label>
          <input
            type="tel"
            required
            value={invitePhone}
            onChange={(e) => setInvitePhone(e.target.value)}
            placeholder="+221 77 000 00 00"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 14 }}
          />
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Mot de passe (Défaut)</label>
          <input
            type="text"
            required
            value={invitePassword}
            onChange={(e) => setInvitePassword(e.target.value)}
            placeholder="Mot de passe"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 14 }}
          />
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Rôle Attribué</label>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 14 }}
          >
            <option value="SUPER_ADMIN">SUPER_ADMIN (Accès Total)</option>
            <option value="FINANCE">FINANCE (Finance & Devis)</option>
            <option value="SUPPORT">SUPPORT (Tenants & Diagnostic)</option>
            <option value="TECHNIQUE">TECHNIQUE (Logs, Sécurité & BI)</option>
          </select>
        </div>
        <button
          type="submit"
          style={{ flex: '1 1 200px', background: themeColor, color: 'var(--text-inverse)', border: 'none', padding: '11px 20px', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Créer Collaborateur
        </button>
      </form>

      {/* Liste des collaborateurs actifs */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, color: '#0F172A' }}>
          Collaborateurs Actifs ({team.length})
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '14px 20px' }}>Nom Complète</th>
              <th style={{ padding: '14px 20px' }}>Email</th>
              <th style={{ padding: '14px 20px' }}>Téléphone</th>
              <th style={{ padding: '14px 20px' }}>Rôles</th>
              <th style={{ padding: '14px 20px' }}>2FA</th>
              <th style={{ padding: '14px 20px' }}>Statut</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {team.map((u) => {
              const isSelf = currentUser?.id === u.id;
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>{u.fullName}</td>
                  <td style={{ padding: '14px 20px' }}>{u.email}</td>
                  <td style={{ padding: '14px 20px' }}>{u.phone || 'Non renseigné'}</td>
                  <td style={{ padding: '14px 20px' }}>
                    {u.roles.map((r) => (
                      <span key={r} style={{ padding: '2px 8px', background: '#EEF2FF', color: '#3730A3', borderRadius: 4, fontSize: 12, fontWeight: 600, marginRight: 6 }}>
                        {r}
                      </span>
                    ))}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {u.totpEnabled ? (
                      <span style={{ color: '#16A34A', fontWeight: 700, fontSize: 12 }}>Activé</span>
                    ) : (
                      <span style={{ color: '#DC2626', fontWeight: 700, fontSize: 12 }}>Désactivé</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: u.isActive ? '#DCFCE7' : '#FEE2E2', color: u.isActive ? '#166534' : '#991B1B' }}>
                      {u.isActive ? 'ACTIF' : 'DÉSACTIVÉ'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Modification Rôle */}
                    <select
                      value={u.roles[0] || ''}
                      onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                      style={{ padding: '6px', borderRadius: 4, fontSize: 12, border: '1px solid var(--border-color)', height: 32 }}
                    >
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      <option value="FINANCE">FINANCE</option>
                      <option value="SUPPORT">SUPPORT</option>
                      <option value="TECHNIQUE">TECHNIQUE</option>
                    </select>

                    {/* Activation / Désactivation Statut */}
                    <button
                      onClick={() => handleToggleStatus(u.id, u.isActive)}
                      disabled={isSelf}
                      style={{
                        padding: '6px 12px',
                        background: u.isActive ? '#EF4444' : '#10B981',
                        color: 'var(--text-inverse)',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: isSelf ? 'not-allowed' : 'pointer',
                        opacity: isSelf ? 0.6 : 1,
                        height: 32
                      }}
                      title={isSelf ? "Vous ne pouvez pas vous désactiver vous-même" : ""}
                    >
                      {u.isActive ? 'Suspendre' : 'Activer'}
                    </button>

                    {/* Modifier les Coordonnées */}
                    <button
                      onClick={() => handleOpenEdit(u)}
                      style={{ padding: '6px 12px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', height: 32 }}
                    >
                      ✏️ Edit
                    </button>

                    {/* Réinitialiser les accès */}
                    <button
                      onClick={() => handleResetPassword(u.id, u.fullName)}
                      style={{ padding: '6px 12px', background: '#F59E0B', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', height: 32 }}
                      title="Générer un mot de passe temporaire"
                    >
                      🔑 Accès
                    </button>

                    {/* Urgence Désactiver 2FA */}
                    <button
                      onClick={() => handleDisable2FA(u.id)}
                      disabled={!u.totpEnabled}
                      style={{
                        padding: '6px 12px',
                        background: '#FEF2F2',
                        color: u.totpEnabled ? '#B91C1C' : '#9CA3AF',
                        border: '1px solid ' + (u.totpEnabled ? '#FCA5A5' : '#E5E7EB'),
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: u.totpEnabled ? 'pointer' : 'not-allowed',
                        opacity: u.totpEnabled ? 1 : 0.6,
                        height: 32
                      }}
                      title={u.totpEnabled ? "Désactiver le 2FA de ce compte en urgence" : "Le 2FA n'est pas activé"}
                    >
                      🔓 2FA
                    </button>

                    {/* Suppression définitive */}
                    <button
                      onClick={() => handleDelete(u.id, u.fullName)}
                      disabled={isSelf}
                      style={{
                        padding: '6px 12px',
                        background: '#991B1B',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: isSelf ? 'not-allowed' : 'pointer',
                        opacity: isSelf ? 0.6 : 1,
                        height: 32
                      }}
                      title={isSelf ? "Vous ne pouvez pas vous supprimer vous-même" : "Supprimer définitivement de la console"}
                    >
                      🗑️ Supprimer
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── MODAL MODIFIER COLLABORATEUR ─── */}
      {editingCollab && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <form onSubmit={handleSaveEdit} style={{ background: 'var(--bg-card)', padding: 28, borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontFamily: "'Sora', sans-serif", fontWeight: 800 }}>✏️ Modifier les Coordonnées du Collaborateur</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Nom complet</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Téléphone</label>
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Email</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button type="button" onClick={() => setEditingCollab(null)} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', fontWeight: 700, cursor: 'pointer' }}>
                Annuler
              </button>
              <button type="submit" style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: themeColor, color: 'var(--text-inverse)', fontWeight: 800, cursor: 'pointer' }}>
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
