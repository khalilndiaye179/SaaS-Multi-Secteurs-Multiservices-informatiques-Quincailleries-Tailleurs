import React from 'react';
import { Modal } from './Modal';

export interface CompanyHeaderDetails {
  tenantName: string;
  tenantCode: string;
  logoSvg?: string;
  address?: string;
  phone?: string;
  email?: string;
  nineaRccm?: string;
  enableTva: boolean;
  tvaRate: number; // ex 18
}

interface DocumentPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  documentType: 'DEVIS' | 'FACTURE' | 'TICKET_SAV' | 'BON_COMMANDE';
  documentNumber: string;
  dateStr: string;
  clientName: string;
  clientPhone?: string;
  items: Array<{ description: string; quantity: number; unitPrice: number }>;
  themeColor: string;
}

export const DocumentPrintModal: React.FC<DocumentPrintModalProps> = ({
  isOpen,
  onClose,
  title,
  documentType,
  documentNumber,
  dateStr,
  clientName,
  clientPhone,
  items,
  themeColor,
}) => {
  // Récupération du tenant courant pour l'isolation stricte des paramètres d'en-tête et logo
  const currentUser = JSON.parse(localStorage.getItem('kpsy_user') || '{}');

  const currentTenant = JSON.parse(localStorage.getItem('kpsy_tenant') || '{}');
  const tenantCode = currentTenant?.code || currentUser?.tenant?.code || currentUser?.tenantCode || 'TLR-0001';
  const settingsKey = `kpsy_company_settings_${tenantCode}`;

  // Chargement des paramètres d'entreprise isolés pour ce tenant spécifique
  const savedSettingsStr = localStorage.getItem(settingsKey);
  const savedSettings: Partial<CompanyHeaderDetails> = savedSettingsStr ? JSON.parse(savedSettingsStr) : {};


  const company: CompanyHeaderDetails = {
    tenantName: currentTenant?.name || savedSettings.tenantName || 'Atelier Couture Elegance',
    tenantCode: tenantCode,
    address: savedSettings.address || 'Avenue Cheikh Anta Diop, Dakar, Sénégal',
    phone: savedSettings.phone || '+221 33 800 00 00',
    email: savedSettings.email || 'contact@couture.sn',
    nineaRccm: savedSettings.nineaRccm || 'NINEA: 009876543 2V3 / RCCM: SN-DKR-2026-B-9999',
    enableTva: savedSettings.enableTva ?? false,
    tvaRate: savedSettings.tvaRate || 18,
    logoSvg: savedSettings.logoSvg,
  };




  const totalHt = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tvaAmount = company.enableTva ? (totalHt * (company.tvaRate || 18)) / 100 : 0;
  const totalTtc = totalHt + tvaAmount;

  const handlePrint = () => {
    const printContent = document.getElementById('printable-document');
    if (!printContent) return;
    const win = window.open('', '', 'width=900,height=700');
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>${documentType} - ${documentNumber}</title>
          <style>
            body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; margin: 30px; color: #111827; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid ${themeColor}; padding-bottom: 20px; margin-bottom: 20px; }
            .logo { max-width: 160px; max-height: 80px; }
            .company-title { font-size: 1.4rem; font-weight: 800; color: ${themeColor}; margin: 0 0 4px 0; }
            .company-info { font-size: 0.8rem; color: #4B5563; line-height: 1.4; }
            .doc-title { text-align: right; }
            .doc-type { font-size: 1.5rem; font-weight: 900; color: ${themeColor}; text-transform: uppercase; margin: 0; }
            .doc-num { font-size: 0.9rem; font-weight: 700; color: #374151; margin-top: 4px; }
            .client-box { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 14px; margin-bottom: 24px; font-size: 0.88rem; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 0.88rem; }
            th { background: #F3F4F6; padding: 10px; border-bottom: 2px solid #E5E7EB; text-align: left; font-weight: 700; }
            td { padding: 10px; border-bottom: 1px solid #E5E7EB; }
            .totals { width: 300px; margin-left: auto; font-size: 0.9rem; }
            .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
            .grand-total { border-top: 2px solid ${themeColor}; font-weight: 800; font-size: 1.1rem; color: ${themeColor}; padding-top: 8px !important; }
            .footer { margin-top: 40px; text-align: center; font-size: 0.75rem; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 12px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Document Imprimable */}
        <div id="printable-document" style={{ background: 'white', padding: 24, borderRadius: 10, border: '1px solid #E5E7EB', position: 'relative', overflow: 'hidden' }}>
          
          {/* Contenu principal zIndex 1 pour visibilité maximale sans filigrane obstruant */}
          <div style={{ position: 'relative', zIndex: 1 }}>

            {/* Header avec Logo SVG Miniature en haut à gauche */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${themeColor}`, paddingBottom: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {company.logoSvg ? (
                  <div
                    style={{
                      maxWidth: 90,
                      maxHeight: 50,
                      objectFit: 'contain',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: company.logoSvg.replace(/width="[^"]*"/, 'width="100%"').replace(/height="[^"]*"/, 'height="100%"'),
                    }}
                  />
                ) : (
                  <div style={{ width: 42, height: 42, borderRadius: 8, background: themeColor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                    {company.tenantName ? company.tenantName.substring(0, 2).toUpperCase() : 'K'}
                  </div>
                )}

                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: themeColor, margin: '0 0 2px 0', fontFamily: "'Sora', sans-serif" }}>
                    {company.tenantName}
                  </h2>
                  <div style={{ fontSize: '0.76rem', color: '#4B5563', lineHeight: 1.35 }}>
                    <div>{company.address}</div>
                    <div>Tél : {company.phone} | Email : {company.email}</div>
                    {company.nineaRccm && <div style={{ fontWeight: 600, color: '#374151', marginTop: 2 }}>{company.nineaRccm}</div>}
                  </div>
                </div>
              </div>


            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: themeColor, textTransform: 'uppercase' }}>
                {documentType.replace('_', ' ')}
              </div>

              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#374151', marginTop: 4 }}>
                N° : {documentNumber}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 2 }}>
                Date : {dateStr}
              </div>
            </div>
          </div>

          {/* Informations Client */}
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 700, color: '#374151', marginBottom: 2 }}>CLIENT / DESTINATAIRE :</div>
            <div style={{ fontWeight: 800, color: '#111827', fontSize: '0.95rem' }}>{clientName}</div>
            {clientPhone && <div style={{ color: '#6B7280' }}>Téléphone : {clientPhone}</div>}
          </div>

          {/* Tableau des Lignes */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#F3F4F6', borderBottom: '2px solid #E5E7EB' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Désignation</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700 }}>Qté</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>P.U. (XOF)</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>Total HT (XOF)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{item.description}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{item.unitPrice.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                    {(item.quantity * item.unitPrice).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Récapitulatif Financier avec TVA Optionnelle */}
          <div style={{ width: 280, marginLeft: 'auto', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#4B5563' }}>
              <span>Total Hors Taxe (HT) :</span>
              <span style={{ fontWeight: 700 }}>{totalHt.toLocaleString()} XOF</span>
            </div>

            {company.enableTva ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#4B5563' }}>
                <span>TVA ({company.tvaRate}%) :</span>
                <span style={{ fontWeight: 700 }}>{tvaAmount.toLocaleString()} XOF</span>
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: '#059669', fontStyle: 'italic', padding: '4px 0' }}>
                ✓ Exonéré de TVA (Régime réel simplifié UEMOA)
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: `2px solid ${themeColor}`, fontWeight: 800, fontSize: '1.05rem', color: themeColor, marginTop: 4 }}>
              <span>Net à Payer (TTC) :</span>
              <span>{totalTtc.toLocaleString()} XOF</span>
            </div>
          </div>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.72rem', color: '#9CA3AF', borderTop: '1px solid #E5E7EB', paddingTop: 10 }}>
            Document généré officiellement par KPSyDesk Business Suite — Merci de votre confiance.
          </div>
          </div>
        </div>


        {/* Boutons d'Action Modal */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #D1D5DB', background: 'white', fontWeight: 600, cursor: 'pointer' }}>
            Fermer
          </button>
          <button
            onClick={handlePrint}
            style={{
              padding: '10px 22px',
              borderRadius: 8,
              border: 'none',
              background: themeColor,
              color: 'white',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: `0 4px 12px ${themeColor}30`,
            }}
          >
            🖨️ Imprimer / Enregistrer PDF
          </button>
        </div>
      </div>
    </Modal>
  );
};

