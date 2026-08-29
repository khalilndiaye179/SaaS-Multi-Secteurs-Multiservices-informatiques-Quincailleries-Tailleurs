import { StorageService } from '../../services/storage';
import React, { useState } from 'react';
import { Modal } from '../shared/Modal';

interface SparePart {
  id: string;
  name: string;
  partNumber: string;
  quantity: number;
  alertThreshold: number;
  unitPriceXOF: number;
}

interface Props {
  themeColor: string;
}

export const ITSparePartsStock: React.FC<Props> = ({ themeColor }) => {
  const user = JSON.parse(localStorage.getItem('kpsy_user') || '{}');
  const isAdmin = !user?.roles || user?.roles?.length === 0 || user?.roles?.includes('TENANT_ADMIN') || user?.roles?.includes('ADMIN_TENANT') || user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN');


  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(false);

  let token;
    StorageService.get("kpsy_token").then(t => token = t);
    // FIXME: token fetch is now async, might break sync logic
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchParts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quincaillerie/stock', { headers });
      if (res.ok) {
        const data = await res.json();
        // Map backend StockItem to frontend SparePart
        const mapped = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          partNumber: item.sku,
          quantity: item.quantity,
          alertThreshold: item.alertThreshold,
          unitPriceXOF: item.sellingPrice,
        }));
        setParts(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchParts();
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [alertThreshold, setAlertThreshold] = useState(2);
  const [unitPriceXOF, setUnitPriceXOF] = useState(15000);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setPartNumber('');
    setQuantity(5);
    setAlertThreshold(2);
    setUnitPriceXOF(15000);
    setShowModal(true);
  };

  const handleOpenEdit = (p: SparePart) => {
    setEditingId(p.id);
    setName(p.name);
    setPartNumber(p.partNumber);
    setQuantity(p.quantity);
    setAlertThreshold(p.alertThreshold);
    setUnitPriceXOF(p.unitPriceXOF);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      alert('Action réservée à l\'Administrateur de l\'établissement.');
      return;
    }
    if (window.confirm('Voulez-vous vraiment supprimer cette pièce détachée du stock ?')) {
      try {
        const res = await fetch(`/api/quincaillerie/stock/${id}`, { method: 'DELETE', headers });
        if (res.ok) {
          fetchParts();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      sku: partNumber,
      unit: 'piece',
      purchasePrice: Math.round(unitPriceXOF * 0.7), // Estimate purchase price for now
      sellingPrice: unitPriceXOF,
      quantity,
      alertThreshold,
    };

    try {
      if (editingId) {
        await fetch(`/api/quincaillerie/stock/${editingId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/quincaillerie/stock', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      fetchParts();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: 'var(--text-main)' }}>
            Stock Pièces Détachées Atelier ({parts.length})
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Inventaire des composants (dalles, batteries, claviers, nappes) réservés aux réparations SAV
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
            + Ajouter une Pièce Détachée
          </button>
        )}
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
            <tr>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Désignation Pièce</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Référence / P/N</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Prix Unitaire (XOF)</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Stock Disponible</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '14px 18px', fontWeight: 700 }}>{p.name}</td>
                <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 600 }}>{p.partNumber}</td>
                <td style={{ padding: '14px 18px', fontWeight: 800, color: themeColor }}>
                  {p.unitPriceXOF.toLocaleString()} XOF
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.75rem', background: p.quantity <= p.alertThreshold ? '#FEE2E2' : '#D1FAE5', color: p.quantity <= p.alertThreshold ? '#DC2626' : '#065F46' }}>
                    {p.quantity} unités (seuil {p.alertThreshold})
                  </span>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleOpenEdit(p)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                      ✏️ Edit
                    </button>
                    {isAdmin && (
                      <button onClick={() => handleDelete(p.id)} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#FEE2E2', color: '#DC2626', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                        🗑️ Supprimer
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Ajout / Modification */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Modifier la Pièce Détachée' : 'Ajouter une Pièce Détachée'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Désignation Pièce</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Clavier HP ProBook 450 G5 Azerty" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Référence / Part Number (P/N)</label>
            <input required value={partNumber} onChange={(e) => setPartNumber(e.target.value)} placeholder="ex: KB-HP-450G5" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', fontFamily: 'monospace' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Prix Unit. (XOF)</label>
              <input type="number" required value={unitPriceXOF} onChange={(e) => setUnitPriceXOF(Number(e.target.value))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Quantité Initial</label>
              <input type="number" required value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Seuil Alerte</label>
              <input type="number" required value={alertThreshold} onChange={(e) => setAlertThreshold(Number(e.target.value))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)' }} />
            </div>
          </div>

          <button type="submit" style={{ padding: 12, borderRadius: 8, border: 'none', background: themeColor, color: 'var(--text-inverse)', fontWeight: 800, cursor: 'pointer', marginTop: 10 }}>
            Enregistrer dans l'Inventaire ✓
          </button>
        </form>
      </Modal>
    </div>
  );
};
