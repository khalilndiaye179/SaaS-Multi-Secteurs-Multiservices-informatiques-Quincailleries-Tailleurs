import React, { useState } from 'react';

interface PurchaseOrder {
  id: string;
  supplierName: string;
  itemDescription: string;
  qtyOrdered: number;
  totalCostXOF: number;
  status: 'PENDING' | 'RECEIVED';
}

interface Props {
  themeColor: string;
}

export const QuincailleriePurchasesManager: React.FC<Props> = ({ themeColor }) => {
  const [orders] = useState<PurchaseOrder[]>([
    { id: '1', supplierName: 'SOCOCIM Industries Senegal', itemDescription: 'Ciment SOCOCIM 50kg (Palette 40 sacs)', qtyOrdered: 120, totalCostXOF: 360000, status: 'RECEIVED' },
    { id: '2', supplierName: 'Quincaillerie Générale de Rufisque', itemDescription: 'Fer à Béton 12mm (Bottes 500kg)', qtyOrdered: 10, totalCostXOF: 450000, status: 'PENDING' },
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: '#111827' }}>
          Achats & Commandes Fournisseurs
        </h2>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
          Suivi des approvisionnements en matériaux de construction et réassortiments auprès des usines/grossistes
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
            <tr>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Fournisseur</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Désignation Réapprovisionnement</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Quantité</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Coût Total (XOF)</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '14px 18px', fontWeight: 700 }}>{o.supplierName}</td>
                <td style={{ padding: '14px 18px' }}>{o.itemDescription}</td>
                <td style={{ padding: '14px 18px', fontWeight: 700 }}>{o.qtyOrdered} unités</td>
                <td style={{ padding: '14px 18px', fontWeight: 800, color: themeColor }}>
                  {o.totalCostXOF.toLocaleString()} XOF
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      background: o.status === 'RECEIVED' ? '#D1FAE5' : '#FEF3C7',
                      color: o.status === 'RECEIVED' ? '#065F46' : '#92400E',
                    }}
                  >
                    {o.status === 'RECEIVED' ? 'Livré au Stock' : 'En attente usine'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
