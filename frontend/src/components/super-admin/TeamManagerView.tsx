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

  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState('FINANCE');

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
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de l\'équipe Super Admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await SuperAdminApiService.inviteCollaborator({ email: inviteEmail, phone: invitePhone, roleName: inviteRole });
      alert(`Invitation créée avec succès !\nLien transmis : ${res.invitationLink}`);
      setInviteEmail('');
      setInvitePhone('');
      fetchTeam();
    } catch (err: any) {
      alert(`Échec de l'invitation : ${err.message}`);
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

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des collaborateurs...</div>;
  if (error?.includes('403')) return <ForbiddenState message="Seul le rôle SUPER_ADMIN est autorisé à gérer l'équipe d'administration." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>👥 Collaborateurs & RBAC Granulaire</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Gestion de l'équipe Super Admin et protection du dernier SUPER_ADMIN</p>
        </div>
      </div>

      {/* Formulaire d'invitation */}
      <form onSubmit={handleInvite} style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)', display: 'flex', gap: 16, alignItems: 'flex-end' }}>
        <div style={{ flex: 2 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Email Collaborateur</label>
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="collaborateur@doorwaar.sn"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 14 }}
          />
        </div>
        <div style={{ flex: 2 }}>
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
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Rôle Attribué</label>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 14 }}
          >
            <option value="SUPER_ADMIN">SUPER_ADMIN (Accès Total)</option>
            <option value="FINANCE">FINANCE (Finance & Devis)</option>
            <option value="SUPPORT">SUPPORT (Tenants & Diagnostic)</option>
            <option value="AUDITOR">AUDITOR (Lecture seule Logs/BI)</option>
          </select>
        </div>
        <button
          type="submit"
          style={{ background: themeColor, color: 'var(--text-inverse)', border: 'none', padding: '11px 20px', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Inviter Collaborateur
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
              <th style={{ padding: '14px 20px' }}>Rôles</th>
              <th style={{ padding: '14px 20px' }}>Statut</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {team.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '14px 20px', fontWeight: 600 }}>{u.fullName}</td>
                <td style={{ padding: '14px 20px' }}>{u.email}</td>
                <td style={{ padding: '14px 20px' }}>
                  {u.roles.map((r) => (
                    <span key={r} style={{ padding: '2px 8px', background: '#EEF2FF', color: '#3730A3', borderRadius: 4, fontSize: 12, fontWeight: 600, marginRight: 6 }}>
                      {r}
                    </span>
                  ))}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: u.isActive ? '#DCFCE7' : '#FEE2E2', color: u.isActive ? '#166534' : '#991B1B' }}>
                    {u.isActive ? 'ACTIF' : 'DÉSACTIVÉ'}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                  <button
                    onClick={() => handleToggleStatus(u.id, u.isActive)}
                    style={{ padding: '6px 12px', background: u.isActive ? '#EF4444' : '#10B981', color: 'var(--text-inverse)', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    {u.isActive ? 'Désactiver' : 'Activer'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
