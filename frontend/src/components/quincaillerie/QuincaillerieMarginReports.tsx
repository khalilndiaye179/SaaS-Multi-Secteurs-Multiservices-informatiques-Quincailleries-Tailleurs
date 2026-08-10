import React, { useState, useEffect } from 'react';

interface StockReport {
  totalItems: number;
  totalPurchaseValueXOF: number;
  totalSellingValueXOF: number;
  potentialMarginXOF: number;
}

interface Props {
  themeColor: string;
}

export const QuincaillerieMarginReports: React.FC<Props> = ({ themeColor }) => {
  const [report, setReport] = useState<StockReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      const token = localStorage.getItem('kpsy_token');
      try {
        const res = await fetch('/api/quincaillerie/stock/reports', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setReport(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: '#111827' }}>
          Rapports Financiers & Valorisation de Stock
        </h2>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
          Analyse de la valeur totale du stock (Prix Achat vs Prix Vente) et marge brute potentielle en XOF
        </p>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Chargement des données financières...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 14, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '0.82rem', color: '#6B7280', fontWeight: 600 }}>Valeur d'Achat du Stock</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 6, color: '#374151', fontFamily: "'Sora', sans-serif" }}>
              {report?.totalPurchaseValueXOF?.toLocaleString() || 0} XOF
            </div>
            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: 4 }}>Capital immobilisé</div>
          </div>

          <div style={{ background: 'white', padding: 24, borderRadius: 14, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '0.82rem', color: '#6B7280', fontWeight: 600 }}>Valeur de Vente Potentielle</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 6, color: themeColor, fontFamily: "'Sora', sans-serif" }}>
              {report?.totalSellingValueXOF?.toLocaleString() || 0} XOF
            </div>
            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: 4 }}>Chiffre d'affaires brut estimé</div>
          </div>

          <div style={{ background: 'white', padding: 24, borderRadius: 14, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '0.82rem', color: '#6B7280', fontWeight: 600 }}>Marge Brute Potentielle</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 6, color: '#059669', fontFamily: "'Sora', sans-serif" }}>
              +{report?.potentialMarginXOF?.toLocaleString() || 0} XOF
            </div>
            <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: 4, fontWeight: 700 }}>Benefice brut attendu</div>
          </div>
        </div>
      )}
    </div>
  );
};
