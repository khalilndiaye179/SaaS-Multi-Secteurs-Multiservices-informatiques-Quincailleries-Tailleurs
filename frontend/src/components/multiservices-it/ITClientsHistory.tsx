import React, { useState } from 'react';

interface ITClient {
  id: string;
  name: string;
  phone: string;
  totalDevicesDeposited: number;
  totalSpentXOF: number;
}

interface Props {
  themeColor: string;
}

export const ITClientsHistory: React.FC<Props> = ({ themeColor }) => {
  const [clients] = useState<ITClient[]>([
    { id: '1', name: 'Mamadou DIALLO', phone: '+221 78 111 22 33', totalDevicesDeposited: 3, totalSpentXOF: 45000 },
    { id: '2', name: 'Cabinet Aissatou & Associés', phone: '+221 33 821 00 99', totalDevicesDeposited: 7, totalSpentXOF: 185000 },
    { id: '3', name: 'Ousmane SOW', phone: '+221 77 450 12 89', totalDevicesDeposited: 2, totalSpentXOF: 25000 },
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: 'var(--text-main)' }}>
          Suivi Client & Historique SAV
        </h2>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Fiches clients, appareils récurrents déposés et volume d'affaires total généré
        </p>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
            <tr>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Nom du Client / Entreprise</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Téléphone</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Appareils Déposés</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Total Dépensé (XOF)</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '14px 18px', fontWeight: 700 }}>{c.name}</td>
                <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{c.phone}</td>
                <td style={{ padding: '14px 18px', fontWeight: 700 }}>{c.totalDevicesDeposited} dépôts</td>
                <td style={{ padding: '14px 18px', fontWeight: 800, color: themeColor }}>
                  {c.totalSpentXOF.toLocaleString()} XOF
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
