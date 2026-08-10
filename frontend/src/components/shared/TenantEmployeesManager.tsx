import React, { useState } from 'react';
import { Modal } from './Modal';

interface PermissionOption {
  id: string;
  label: string;
  category: string;
}

const AVAILABLE_PERMISSIONS: PermissionOption[] = [
  { id: 'BILLING_VIEW', label: 'Consulter Devis & Factures', category: 'Facturation' },
  { id: 'BILLING_CREATE', label: 'Créer / Imprimer Devis & Factures', category: 'Facturation' },
  { id: 'BILLING_CANCEL', label: 'Annuler Devis & Factures (Admin)', category: 'Facturation' },
  { id: 'SAV_TICKETS_VIEW', label: 'Consulter Fiches SAV / Réparations', category: 'Atelier IT' },
  { id: 'SAV_TICKETS_MANAGE', label: 'Créer / Modifier Statut SAV', category: 'Atelier IT' },
  { id: 'SAV_TICKETS_CANCEL', label: 'Annuler / Supprimer Tickets SAV', category: 'Atelier IT' },
  { id: 'POS_SALES', label: 'Accès Caisse & Ventes Directes', category: 'Caisse' },
  { id: 'STOCK_MANAGE', label: 'Gérer l\'Inventaire & Pièces', category: 'Stock' },
  { id: 'SETTINGS_ACCESS', label: 'Accéder aux Paramètres d\'Entreprise', category: 'Paramètres' },
];

interface Employee {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  jobTitle: string;
  permissions: string[];
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

  // Définition des permissions par secteur
  const getPermissionsForSector = (): PermissionOption[] => {
    const commonPerms: PermissionOption[] = [
      { id: 'BILLING_VIEW', label: 'Consulter Devis & Factures', category: 'Facturation' },
      { id: 'BILLING_CREATE', label: 'Créer / Imprimer Devis & Factures', category: 'Facturation' },
      { id: 'BILLING_CANCEL', label: 'Annuler Devis & Factures (Admin)', category: 'Facturation' },
      { id: 'SETTINGS_ACCESS', label: 'Accéder aux Paramètres d\'Entreprise', category: 'Paramètres' },
    ];

    if (sector === 'MULTISERVICES_IT') {
      return [
        { id: 'SAV_TICKETS_VIEW', label: 'Consulter Fiches SAV / Réparations', category: 'Atelier IT' },
        { id: 'SAV_TICKETS_MANAGE', label: 'Créer / Modifier Statut SAV', category: 'Atelier IT' },
        { id: 'SAV_TICKETS_CANCEL', label: 'Annuler / Supprimer Tickets SAV', category: 'Atelier IT' },
        { id: 'STOCK_MANAGE', label: 'Gérer Stock Matériels & Pièces', category: 'Stock' },
        ...commonPerms,
      ];
    } else if (sector === 'QUINCAILLERIE') {
      return [
        { id: 'POS_SALES', label: 'Accès Caisse & Ventes Comptoir', category: 'Caisse' },
        { id: 'STOCK_MANAGE', label: 'Gérer l\'Inventaire & Entrées Stock', category: 'Stock' },
        { id: 'PURCHASES_MANAGE', label: 'Gérer les Achats Fournisseurs', category: 'Achats' },
        { id: 'REPORTS_VIEW', label: 'Consulter Rapports & Marges', category: 'Rapports' },
        ...commonPerms,
      ];
    } else if (sector === 'TAILLEUR') {
      return [
        { id: 'MEASUREMENTS_MANAGE', label: 'Saisir & Modifier Mesures Clients', category: 'Atelier Couture' },
        { id: 'ORDERS_MANAGE', label: 'Gérer les Commandes Confection', category: 'Atelier Couture' },
        { id: 'FITTINGS_MANAGE', label: 'Planifier Rendez-vous Essayages', category: 'Atelier Couture' },
        ...commonPerms,
      ];
    }
    return commonPerms;
  };

  const availablePermissions = getPermissionsForSector();

  // Employés par défaut selon secteur
  const getDefaultEmployees = (): Employee[] => {
    if (sector === 'QUINCAILLERIE') {
      return [
        {
          id: '1',
          fullName: 'Modou FALL',
          username: 'QNC-STORE-01',
          email: 'modou@quincaillerie.sn',
          phone: '+221 77 111 22 33',
          jobTitle: 'Gestionnaire du Stock',
          permissions: ['STOCK_MANAGE', 'PURCHASES_MANAGE'],
          status: 'ACTIVE',
          createdAt: '2026-08-01',
        },
        {
          id: '2',
          fullName: 'Fatou KINÉ',
          username: 'QNC-CASH-01',
          email: 'fatou@quincaillerie.sn',
          phone: '+221 78 444 55 66',
          jobTitle: 'Caissière Ventes Comptoir',
          permissions: ['POS_SALES', 'BILLING_VIEW', 'BILLING_CREATE'],
          status: 'ACTIVE',
          createdAt: '2026-08-05',
        },
      ];
    } else if (sector === 'TAILLEUR') {
      return [
        {
          id: '1',
          fullName: 'Abdoulaye SEtable',
          username: 'TLR-TAIL-01',
          email: 'seck@couture.sn',
          phone: '+221 77 333 44 55',
          jobTitle: 'Maître Tailleur / Coupeur',
          permissions: ['MEASUREMENTS_MANAGE', 'ORDERS_MANAGE', 'FITTINGS_MANAGE'],
          status: 'ACTIVE',
          createdAt: '2026-08-02',
        },
      ];
    }
    return [
      {
        id: '1',
        fullName: 'Ibrahima SORY',
        username: 'ITS-TECH-01',
        email: 'sory@multiservices-it.sn',
        phone: '+221 77 222 33 44',
        jobTitle: 'Technicien Senior SAV',
        permissions: ['SAV_TICKETS_VIEW', 'SAV_TICKETS_MANAGE', 'STOCK_MANAGE'],
        status: 'ACTIVE',
        createdAt: '2026-08-01',
      },
      {
        id: '2',
        fullName: 'Awa DIOP',
        username: 'ITS-CASH-01',
        email: 'awa@multiservices-it.sn',
        phone: '+221 78 555 66 77',
        jobTitle: 'Caissière & Réceptionniste',
        permissions: ['BILLING_VIEW', 'BILLING_CREATE', 'SAV_TICKETS_VIEW'],
        status: 'ACTIVE',
        createdAt: '2026-08-05',
      },
    ];
  };

  const [employees, setEmployees] = useState<Employee[]>(getDefaultEmployees());


  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('Technicien IT');
  const [password, setPassword] = useState('Pass2026!');
  const [selectedPerms, setSelectedPerms] = useState<string[]>(['SAV_TICKETS_VIEW', 'BILLING_VIEW']);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFullName('');
    setUsername(`EMP-${Math.floor(100 + Math.random() * 900)}`);
    setEmail('');
    setPhone('');
    setJobTitle('Technicien IT');
    setPassword('Pass2026!');
    setSelectedPerms(['SAV_TICKETS_VIEW', 'BILLING_VIEW']);
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
    setSelectedPerms(emp.permissions || []);
    setShowModal(true);
  };

  const handleTogglePerm = (permId: string) => {
    if (selectedPerms.includes(permId)) {
      setSelectedPerms(selectedPerms.filter((p) => p !== permId));
    } else {
      setSelectedPerms([...selectedPerms, permId]);
    }
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
    if (editingId) {
      setEmployees(
        employees.map((emp) =>
          emp.id === editingId
            ? { ...emp, fullName, username, email, phone, jobTitle, permissions: selectedPerms }
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
        permissions: selectedPerms,
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
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: '#111827' }}>
            Gestion des Collaborateurs & Droits d'Accès ({employees.length})
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
            Création de comptes employés et attribution des rôles spécifiques par cases à cocher
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: themeColor,
              color: 'white',
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

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
            <tr>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Nom & Identifiant</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Poste / Fonction</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Contact (Email & Tél)</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Permissions Accordées</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Statut</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Actions Admin</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ fontWeight: 700, color: '#111827' }}>{emp.fullName}</div>
                  <div style={{ fontSize: '0.75rem', color: themeColor, fontFamily: 'monospace', fontWeight: 700 }}>@{emp.username}</div>
                </td>
                <td style={{ padding: '14px 18px', fontWeight: 600, color: '#374151' }}>{emp.jobTitle}</td>
                <td style={{ padding: '14px 18px' }}>
                  <div>{emp.email}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{emp.phone}</div>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 260 }}>
                    {emp.permissions.map((p) => {
                      const opt = availablePermissions.find((item) => item.id === p);
                      return (
                        <span key={p} style={{ padding: '2px 6px', borderRadius: 4, background: '#F1F5F9', color: '#475569', fontSize: '0.7rem', fontWeight: 600 }}>
                          {opt ? opt.label : p}
                        </span>
                      );
                    })}
                  </div>
                </td>

                <td style={{ padding: '14px 18px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.75rem', background: emp.status === 'ACTIVE' ? '#D1FAE5' : '#FEE2E2', color: emp.status === 'ACTIVE' ? '#065F46' : '#DC2626' }}>
                    {emp.status === 'ACTIVE' ? 'Actif 🟢' : 'Suspendu 🔴'}
                  </span>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleOpenEdit(emp)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Modifier les Permissions de l\'Employé' : 'Créer un Compte Collaborateur'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Nom Complet</label>
              <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ex: Ousmane FALL" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Poste / Fonction</label>
              <input required value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="ex: Technicien Atelier" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Identifiant (Username)</label>
              <input required value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB', fontFamily: 'monospace', fontWeight: 700 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Mot de Passe Initial</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Adresse Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="employe@entreprise.sn" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Numéro Téléphone</label>
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+221 77 000 00 00" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB' }} />
            </div>
          </div>

          {/* Grille de Permissions par Cases à Cocher */}
          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 10, marginTop: 4 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#111827', marginBottom: 8 }}>
              Permissions & Accès Modules (Cocher pour autoriser) :
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#F9FAFB', padding: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}>
              {availablePermissions.map((perm) => (
                <label key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedPerms.includes(perm.id)}
                    onChange={() => handleTogglePerm(perm.id)}
                    style={{ width: 16, height: 16, accentColor: themeColor }}
                  />
                  <span>{perm.label}</span>
                </label>
              ))}
            </div>

          </div>

          <button type="submit" style={{ padding: 12, borderRadius: 8, border: 'none', background: themeColor, color: 'white', fontWeight: 800, cursor: 'pointer', marginTop: 10 }}>
            {editingId ? 'Mettre à jour le Collaborateur' : 'Enregistrer le Collaborateur ✓'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
