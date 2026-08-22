import React, { useRef } from 'react';

interface SaaSQuotePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteNumber: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  planName: string;
  durationMonths: number;
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  createdAt: string;
  themeColor?: string;
}

export const SaaSQuotePrintModal: React.FC<SaaSQuotePrintModalProps> = ({
  isOpen,
  onClose,
  quoteNumber,
  clientName,
  clientPhone,
  clientEmail,
  planName,
  durationMonths,
  subtotal,
  discount,
  total,
  currency,
  createdAt,
  themeColor = '#312E81',
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;

    const originalContents = document.body.innerHTML;
    document.body.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: black; background: white;">
        ${printContent}
      </div>
    `;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>
        {/* En-tête de la Modal (Ne sera pas imprimé) */}
        <div style={{
          padding: '16px 24px',
          background: '#F1F5F9',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0F172A', fontWeight: 800, fontFamily: "'Sora', sans-serif" }}>
              Visionneuse GED - {quoteNumber}
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>Aperçu avant impression</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handlePrint}
              style={{
                padding: '8px 16px', background: themeColor, color: 'white',
                border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              🖨️ Imprimer
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px', background: '#E2E8F0', color: '#475569',
                border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Fermer
            </button>
          </div>
        </div>

        {/* Contenu à Imprimer (GED) */}
        <div style={{ padding: '40px', overflowY: 'auto', background: 'white' }} ref={printRef}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', color: themeColor, fontWeight: 900 }}>KPSyDesk Suite - Door Waar</h1>
              <p style={{ margin: '4px 0', fontSize: '12px', color: '#475569' }}>
                Avenue Cheikh Anta Diop, Dakar - Sénégal<br />
                Tél: +221 77 123 45 67<br />
                Email: contact@kpsydesk.sn
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#0F172A', textTransform: 'uppercase' }}>DEVIS COMMERCIAL SAAS</h2>
              <h3 style={{ margin: '4px 0', fontSize: '16px', color: '#334155' }}>N° {quoteNumber}</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                Date d'émission : {new Date(createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '40px', padding: '16px', background: '#F8FAFC', borderRadius: '8px', borderLeft: `4px solid ${themeColor}` }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#0F172A', textTransform: 'uppercase' }}>Informations Client</h4>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>{clientName}</div>
            {clientPhone && <div style={{ fontSize: '12px', color: '#475569' }}>Tél : {clientPhone}</div>}
            {clientEmail && <div style={{ fontSize: '12px', color: '#475569' }}>Email : {clientEmail}</div>}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #CBD5E1', color: '#334155', fontSize: '12px', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px' }}>Désignation de l'abonnement</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>Durée</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Total Ligne</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #E2E8F0', fontSize: '13px', color: '#0F172A' }}>
                <td style={{ padding: '12px 8px' }}>
                  <strong>Licence SaaS : {planName}</strong>
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>{durationMonths} Mois</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>
                  {subtotal.toLocaleString('fr-FR')} {currency}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', fontSize: '13px', color: '#475569' }}>
                <span>Sous-Total :</span>
                <strong>{subtotal.toLocaleString('fr-FR')} {currency}</strong>
              </div>
              
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', fontSize: '13px', color: '#166534' }}>
                  <span>Remise Commerciale :</span>
                  <strong>- {discount.toLocaleString('fr-FR')} {currency}</strong>
                </div>
              )}

              <div style={{
                display: 'flex', justifyContent: 'space-between', padding: '12px 8px',
                marginTop: '8px', background: '#F1F5F9', borderRadius: '6px',
                fontSize: '15px', color: '#0F172A', fontWeight: 800
              }}>
                <span>Total Net à Payer :</span>
                <span style={{ color: themeColor }}>{total.toLocaleString('fr-FR')} {currency}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '60px', borderTop: '1px solid #E2E8F0', paddingTop: '16px', textAlign: 'center', fontSize: '10px', color: '#94A3B8' }}>
            Conditions de règlement : Le paiement confirme l'activation immédiate de l'espace locataire et l'acceptation de nos Conditions Générales de Service.<br />
            Document généré électroniquement par KPSyDesk Suite.
          </div>
        </div>
      </div>
    </div>
  );
};
