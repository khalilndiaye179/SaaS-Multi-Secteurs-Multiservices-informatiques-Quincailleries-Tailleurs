import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { TenantRbacApiService, RoleData } from '../../services/tenant-rbac.service';

interface Employee {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  jobTitle: string;
  roleId: string | null;
  roleName?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

interface Props {
  sector: string;
  themeColor: string;
}

export const TenantEmployeesManager: React.FC<Props> = ({ sector, themeColor }) => {
  const user = JSON.parse(localStorage.getItem('kpsy_user') || '{}');
  const isAdmin = !user?.roles || user?.roles?.length === 0 || user?.roles?.includes('TENANT_ADMIN') || user?.roles?.includes('ADMIN_TENANT') || user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN');

  const [roles, setRoles] = useState<RoleData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    fetchRoles();
    fetchEmployeesMock();
  }, []);

  const fetchRoles = async () => {
    try {
      const data = await TenantRbacApiService.getRoles();
      setRoles(data);
    } catch (err) {
      console.error('Error fetching roles', err);
    }
  };

  const fetchEmployeesMock = () => {
    setEmployees([
      {
        id: '1',
        fullName: 'Employé Test',
        username: 'EMP-001',
        email: 'employe@test.sn',
        phone: '+221 77 111 22 33',
        jobTitle: 'Caissier',
        roleId: null,
        status: 'ACTIVE',
        createdAt: '2026-08-01',
      }
    ]);
  };

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('Technicien IT');
  const [password, setPassword] = useState('Pass2026!');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  const handleOpenAdd = () => {
    setEditingId(null);
    setFullName('');
    setUsername(`EMP-${Math.floor(100 + Math.random() * 900)}`);
    setEmail('');
    setPhone('');
    setJobTitle('Technicien IT');
    setPassword('Pass2026!');
    setSelectedRoleId(roles.length > 0 ? roles[0].id : '');
    setShowModal(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    if (!isAdmin) {
      alert('Seul un Administrateur peut modifier un collaborateur.');
      return;
    }
    setEditingId(emp.id);
    setFullName(emp.fullName);
    setUsername(emp.username);
    setEmail(emp.email);
    setPhone(emp.phone);
    setJobTitle(emp.jobTitle);
    setSelectedRoleId(emp.roleId || (roles.length > 0 ? roles[0].id : ''));
    setShowModal(true);
  };

  const handleToggleStatus = (id: string) => {
    if (!isAdmin) return;
    setEmployees(
      employees.map((emp) =>
        emp.id === id ? { ...emp, status: emp.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' } : emp
      )
    );
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('Voulez-vous vraiment supprimer cet employé ?')) {
      setEmployees(employees.filter((emp) => emp.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const roleName = roles.find(r => r.id === selectedRoleId)?.name || '';

    if (editingId) {
      setEmployees(
        employees.map((emp) =>
          emp.id === editingId
            ? { ...emp, fullName, username, email, phone, jobTitle, roleId: selectedRoleId, roleName }
            : emp
        )
      );
    } else {
      const newEmp: Employee = {
        id: Date.now().toString(),
        fullName,
        username,
        email,
        phone,
        jobTitle,
        roleId: selectedRoleId,
        roleName,
        status: 'ACTIVE',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setEmployees([...employees, newEmp]);
    }
    setShowModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: 'var(--text-main)' }}>
            Gestion des Collaborateurs & Droits d'Accès ({employees.length})
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Création de comptes employés et attribution des rôles
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
            + Nouveau Collaborateur
          </button>
        )}
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
            <tr>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Nom & Identifiant</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Poste / Fonction</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Contact (Email & Tél)</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Rôle Assigné</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Statut</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Actions Admin</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{emp.fullName}</div>
                  <div style={{ fontSize: '0.75rem', color: themeColor, fontFamily: 'monospace', fontWeight: 700 }}>@{emp.username}</div>
                </td>
                <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>{emp.jobTitle}</td>
                <td style={{ padding: '14px 18px' }}>
                  <div>{emp.email}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.phone}</div>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: 6, background: '#E0E7FF', color: '#3730A3', fontSize: '0.75rem', fontWeight: 600 }}>
                    {emp.roleName || 'Aucun rôle'}
                  </span>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.75rem', background: emp.status === 'ACTIVE' ? '#D1FAE5' : '#FEE2E2', color: emp.status === 'ACTIVE' ? '#065F46' : '#DC2626' }}>
                    {emp.status === 'ACTIVE' ? 'Actif 🟢' : 'Suspendu 🔴'}
                  </span>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleOpenEdit(emp)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                        ✏️ Rôles
                      </button>
                      <button onClick={() => handleToggleStatus(emp.id)} style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: emp.status === 'ACTIVE' ? '#FEF3C7' : '#D1FAE5', color: emp.status === 'ACTIVE' ? '#92400E' : '#065F46', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                        {emp.status === 'ACTIVE' ? '🔒 Suspendre' : '🔓 Activer'}
                      </button>
                      <button onClick={() => handleDelete(emp.id)} style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#FEE2E2', color: '#DC2626', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                        🗑️
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Création / Édition Collaborateur */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Modifier l\'Employé' : 'Créer un Compte Collaborateur'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Nom Complet</label>
              <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ex: Ousmane FALL" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Poste / Fonction</label>
              <input required value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="ex: Technicien Atelier" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Identifiant (Username)</label>
              <input required value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', fontFamily: 'monospace', fontWeight: 700 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Mot de Passe Initial</label>
              <input type="password" required={!editingId} value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Adresse Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="employe@entreprise.sn" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Numéro Téléphone</label>
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+221 77 000 00 00" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)' }} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10, marginTop: 4 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>
              Rôle Assigné :
            </label>
            <select 
              value={selectedRoleId} 
              onChange={e => setSelectedRoleId(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)' }}
              required
            >
              <option value="" disabled>Sélectionner un rôle</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" style={{ padding: 12, borderRadius: 8, border: 'none', background: themeColor, color: 'var(--text-inverse)', fontWeight: 800, cursor: 'pointer', marginTop: 10 }}>
            {editingId ? 'Mettre à jour le Collaborateur' : 'Enregistrer le Collaborateur ✓'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
