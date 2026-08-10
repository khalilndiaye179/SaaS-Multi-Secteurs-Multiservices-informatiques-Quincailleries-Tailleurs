import React, { useState, useEffect } from 'react';

interface StockMovement {
  id: string;
  stockItemId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  unitPrice?: number;
  reason?: string;
  createdAt: string;
}

interface Props {
  themeColor: string;
}

export const QuincaillerieMovementsManager: React.FC<Props> = ({ themeColor }) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMovements = async () => {
      setLoading(true);
      const token = localStorage.getItem('kpsy_token');
      try {
        const res = await fetch('/api/quincaillerie/stock/movements', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setMovements(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMovements();
  }, []);

  const getTypeBadge = (type: StockMovement['type']) => {
    switch (type) {
      case 'IN':
        return <span style={{ padding: '4px 10px', borderRadius: 20, background: '#D1FAE5', color: '#065F46', fontWeight: 700, fontSize: '0.75rem' }}>ENTRÉE (Réassort)</span>;
      case 'OUT':
        return <span style={{ padding: '4px 10px', borderRadius: 20, background: '#FEE2E2', color: '#DC2626', fontWeight: 700, fontSize: '0.75rem' }}>SORTIE (Vente)</span>;
      case 'ADJUSTMENT':
        return <span style={{ padding: '4px 10px', borderRadius: 20, background: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: '0.75rem' }}>AJUSTEMENT</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: '#111827' }}>
          Historique des Mouvements de Stock
        </h2>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
          Traçabilité complète des flux d'entrées (achats), sorties (ventes) et ajustements d'inventaire
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Chargement de l'historique...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <tr>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Date Mouvement</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Type</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Quantité</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Prix Unitaire (XOF)</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Motif / Remarque</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
                    Aucun mouvement de stock enregistré pour le moment.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '14px 18px', color: '#6B7280' }}>
                      {new Date(m.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td style={{ padding: '14px 18px' }}>{getTypeBadge(m.type)}</td>
                    <td style={{ padding: '14px 18px', fontWeight: 800, color: m.type === 'IN' ? '#059669' : '#DC2626' }}>
                      {m.type === 'IN' ? `+${m.quantity}` : `-${m.quantity}`}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 700 }}>
                      {m.unitPrice ? `${m.unitPrice.toLocaleString()} XOF` : '—'}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#4B5563' }}>{m.reason || 'Saisie automatique system'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
