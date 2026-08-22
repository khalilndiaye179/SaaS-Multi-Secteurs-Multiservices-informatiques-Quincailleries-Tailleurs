import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/api-client';

type Tab = 'CLIENTS' | 'SUPPLIERS';

export const ContactsCrmView = () => {
  const [activeTab, setActiveTab] = useState<Tab>('CLIENTS');
  const [clients, setClients] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'CLIENTS') {
        const data = await ApiClient.get('/api/crm/clients');
        setClients(data);
      } else {
        const data = await ApiClient.get('/api/crm/suppliers');
        setSuppliers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === 'CLIENTS') {
        await ApiClient.post('/api/crm/clients', formData);
      } else {
        await ApiClient.post('/api/crm/suppliers', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Erreur d'enregistrement");
    }
  };

  const openNewModal = () => {
    setFormData({});
    setIsModalOpen(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: '1.5rem', color: '#1A1A1A' }}>
          Contacts / CRM
        </h2>
        <button
          onClick={openNewModal}
          style={{
            background: '#1C4A34', color: 'white', border: 'none',
            padding: '10px 20px', borderRadius: 8, fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          + {activeTab === 'CLIENTS' ? 'Nouveau Client' : 'Nouveau Fournisseur'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 20, borderBottom: '1px solid #E2E8F0' }}>
        <button
          onClick={() => setActiveTab('CLIENTS')}
          style={{
            background: 'none', border: 'none', padding: '10px 15px', cursor: 'pointer',
            fontWeight: activeTab === 'CLIENTS' ? 800 : 500,
            color: activeTab === 'CLIENTS' ? '#1C4A34' : '#64748B',
            borderBottom: activeTab === 'CLIENTS' ? '3px solid #1C4A34' : '3px solid transparent'
          }}
        >
          🏢 Mes Clients
        </button>
        <button
          onClick={() => setActiveTab('SUPPLIERS')}
          style={{
            background: 'none', border: 'none', padding: '10px 15px', cursor: 'pointer',
            fontWeight: activeTab === 'SUPPLIERS' ? 800 : 500,
            color: activeTab === 'SUPPLIERS' ? '#1C4A34' : '#64748B',
            borderBottom: activeTab === 'SUPPLIERS' ? '3px solid #1C4A34' : '3px solid transparent'
          }}
        >
          🏭 Mes Fournisseurs
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <p>Chargement...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', color: '#475569', fontSize: '0.85rem' }}>
                <th style={{ padding: 12, textAlign: 'left' }}>Nom</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Téléphone</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Email</th>
                <th style={{ padding: 12, textAlign: 'left' }}>NINEA</th>
                <th style={{ padding: 12, textAlign: 'left' }}>RCCM</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === 'CLIENTS' ? clients : suppliers).map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #E2E8F0', fontSize: '0.9rem', color: '#1A1A1A' }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>{item.fullName || item.name}</td>
                  <td style={{ padding: 12 }}>{item.phone || '-'}</td>
                  <td style={{ padding: 12 }}>{item.email || '-'}</td>
                  <td style={{ padding: 12 }}>{item.ninea || '-'}</td>
                  <td style={{ padding: 12 }}>{item.rccm || '-'}</td>
                </tr>
              ))}
              {(activeTab === 'CLIENTS' ? clients : suppliers).length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#64748B' }}>
                    Aucun {activeTab === 'CLIENTS' ? 'client' : 'fournisseur'} enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 16, width: '100%', maxWidth: 500 }}>
            <h3 style={{ marginTop: 0 }}>Ajouter un {activeTab === 'CLIENTS' ? 'Client' : 'Fournisseur'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input
                type="text"
                required
                placeholder={activeTab === 'CLIENTS' ? 'Nom du client / Entreprise' : 'Nom du fournisseur'}
                value={formData.name || formData.fullName || ''}
                onChange={e => setFormData({ ...formData, [activeTab === 'CLIENTS' ? 'fullName' : 'name']: e.target.value })}
                style={{ padding: '12px', borderRadius: 8, border: '1px solid #E2E8F0' }}
              />
              <div style={{ display: 'flex', gap: 16 }}>
                <input
                  type="text"
                  placeholder="Téléphone"
                  value={formData.phone || ''}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  style={{ padding: '12px', borderRadius: 8, border: '1px solid #E2E8F0', flex: 1 }}
                />
                <input
                  type="email"
                  placeholder="Email (Optionnel)"
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  style={{ padding: '12px', borderRadius: 8, border: '1px solid #E2E8F0', flex: 1 }}
                />
              </div>
              <input
                type="text"
                placeholder="Adresse (Optionnel)"
                value={formData.address || ''}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                style={{ padding: '12px', borderRadius: 8, border: '1px solid #E2E8F0' }}
              />
              <div style={{ display: 'flex', gap: 16 }}>
                <input
                  type="text"
                  placeholder="NINEA (Optionnel)"
                  value={formData.ninea || ''}
                  onChange={e => setFormData({ ...formData, ninea: e.target.value })}
                  style={{ padding: '12px', borderRadius: 8, border: '1px solid #E2E8F0', flex: 1 }}
                />
                <input
                  type="text"
                  placeholder="RCCM (Optionnel)"
                  value={formData.rccm || ''}
                  onChange={e => setFormData({ ...formData, rccm: e.target.value })}
                  style={{ padding: '12px', borderRadius: 8, border: '1px solid #E2E8F0', flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontWeight: 700 }}>
                  Annuler
                </button>
                <button type="submit" style={{ padding: '10px 20px', background: '#1C4A34', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
