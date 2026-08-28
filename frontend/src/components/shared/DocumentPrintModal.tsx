import React, { useState } from 'react';
import { Modal } from './Modal';
import { normalizeSenegalPhone } from '../../utils/phone.util';

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
  bankName?: string;
  bankAccountName?: string;
  bankCode?: string;
  bankGuichet?: string;
  bankAccountNumber?: string;
  bankRibKey?: string;
  bankIban?: string;
  bankSwift?: string;
}

interface DocumentPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  documentType: 'DEVIS' | 'FACTURE' | 'TICKET_SAV' | 'BON_COMMANDE' | 'FICHE_ESSAYAGE';
  documentNumber: string;
  documentId?: string;
  dateStr: string;
  validUntil?: string;
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
  documentId,
  dateStr,
  validUntil,
  clientName,
  clientPhone,
  items,
  themeColor,
}) => {
  const [waLoading, setWaLoading] = useState(false);

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
    bankName: savedSettings.bankName,
    bankAccountName: savedSettings.bankAccountName,
    bankCode: savedSettings.bankCode,
    bankGuichet: savedSettings.bankGuichet,
    bankAccountNumber: savedSettings.bankAccountNumber,
    bankRibKey: savedSettings.bankRibKey,
    bankIban: savedSettings.bankIban,
    bankSwift: savedSettings.bankSwift,
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
            .logo-wrap { width: 70px; height: 70px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
            .logo-wrap svg { width: 70px !important; height: 70px !important; max-width: 70px !important; max-height: 70px !important; }
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

  const handleShareWhatsApp = async () => {
    const formattedPhone = normalizeSenegalPhone(clientPhone);
    if (!formattedPhone) {
      alert(`Numéro client invalide ou non renseigné (${clientPhone || 'Non renseigné'}). Veuillez renseigner un numéro valide à 9 chiffres.`);
      return;
    }

    setWaLoading(true);
    try {
      const tokenRes = await fetch('/api/public/documents/share-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kpsy_token')}`,
        },
        body: JSON.stringify({
          documentType,
          documentId: documentId || documentNumber,
        }),
      });

      let shareUrl = `${window.location.origin}/api/public/documents/view/pdf?token=`;
      if (tokenRes.ok) {
        const data = await tokenRes.json();
        shareUrl = data.shareUrl || (shareUrl + data.token);
      }

      const typeLabel =
        documentType === 'FACTURE'
          ? 'votre facture'
          : documentType === 'DEVIS'
          ? 'votre devis'
          : documentType === 'TICKET_SAV'
          ? 'votre ticket de réparation SAV'
          : documentType === 'BON_COMMANDE'
          ? 'votre bon de commande couture'
          : 'votre fiche de mesures';

      const message = `Bonjour ${clientName},\n\nVoici ${typeLabel} N° *${documentNumber}* d'un montant de *${totalTtc.toLocaleString()} XOF* émis par *${company.tenantName}*.\n\n📥 Vous pouvez consulter et télécharger votre document PDF sécurisé directement via ce lien (valable 7 jours) :\n${shareUrl}\n\nMerci de votre confiance !`;

      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } catch (err) {
      alert('Erreur lors de la préparation du lien WhatsApp.');
    } finally {
      setWaLoading(false);
    }
  };

  const formattedClientPhone = normalizeSenegalPhone(clientPhone);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth={720}>
      <div style={{ padding: '8px 4px' }}>
        <div id="printable-document">
          <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)' }}>
            {/* Header Officiel */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${themeColor}`, paddingBottom: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                {company.logoSvg && (
                  <div 
                    className="logo-wrap"
                    style={{ 
                      width: 70, 
                      height: 70, 
                      flexShrink: 0,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }} 
                    dangerouslySetInnerHTML={{ 
                      __html: company.logoSvg
                        .replace(/<svg/, '<svg width="70" height="70" style="width:70px; height:70px; max-width:70px; max-height:70px;"') 
                    }} 
                  />
                )}
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: 800, color: themeColor }}>
                    {company.tenantName}
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    <div>{company.address}</div>
                    <div>Tél: {company.phone} • Email: {company.email}</div>
                    {company.nineaRccm && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{company.nineaRccm}</div>}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: themeColor, textTransform: 'uppercase' }}>
                  {documentType.replace('_', ' ')}
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: 4 }}>
                  N° {documentNumber}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Date : {dateStr}
                </div>
                {documentType === 'DEVIS' && validUntil && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Valable jusqu'au : {new Date(validUntil).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>
            </div>

            {/* Fiche Client */}
            <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2 }}>DOCUMENT DESTINÉ À :</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>{clientName}</div>
              {clientPhone && <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>Tél : {clientPhone}</div>}
            </div>

            {/* Tableau des Lignes */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main)', borderBottom: '2px solid #E5E7EB' }}>
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

            {/* Récapitulatif Financier */}
            <div style={{ width: 280, marginLeft: 'auto', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: 'var(--text-muted)' }}>
                <span>Total Hors Taxe (HT) :</span>
                <span style={{ fontWeight: 700 }}>{totalHt.toLocaleString()} XOF</span>
              </div>

              {company.enableTva ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: 'var(--text-muted)' }}>
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

            {/* Infos RIB si renseignées */}
            {company.bankName && company.bankAccountNumber && (
              <div style={{ marginTop: 24, borderTop: '1px dashed var(--border-color)', paddingTop: 12, textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Règlement par virement bancaire :</div>
                <div>
                  Banque : <strong>{company.bankName}</strong> {company.bankAccountName && <>| Titulaire : <strong>{company.bankAccountName}</strong></>}
                </div>
                <div style={{ fontFamily: 'monospace', marginTop: 2 }}>
                  {company.bankCode && <>Code Banque : <strong>{company.bankCode}</strong> </>}
                  {company.bankGuichet && <>• Code Guichet : <strong>{company.bankGuichet}</strong> </>}
                  {company.bankAccountNumber && <>• N° Compte : <strong>{company.bankAccountNumber}</strong> </>}
                  {company.bankRibKey && <>• Clé RIB : <strong>{company.bankRibKey}</strong></>}
                </div>
                {(company.bankIban || company.bankSwift) && (
                  <div style={{ fontFamily: 'monospace', marginTop: 2 }}>
                    {company.bankIban && <>IBAN : <strong>{company.bankIban}</strong> </>}
                    {company.bankSwift && <>• SWIFT/BIC : <strong>{company.bankSwift}</strong></>}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: 16, textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
              Document généré officiellement par KPSyDesk Suite - Door Waar — Merci de votre confiance.
            </div>
          </div>
        </div>

        {/* Boutons d'Action Modal */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', fontWeight: 600, cursor: 'pointer' }}>
            Fermer
          </button>
          
          <button
            onClick={handleShareWhatsApp}
            disabled={waLoading || !formattedClientPhone}
            title={!formattedClientPhone ? 'Numéro client invalide ou manquant' : 'Partager le document PDF via WhatsApp'}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              background: formattedClientPhone ? '#25D366' : '#9CA3AF',
              color: 'var(--text-inverse)',
              fontWeight: 800,
              cursor: formattedClientPhone && !waLoading ? 'pointer' : 'not-allowed',
              boxShadow: formattedClientPhone ? '0 4px 12px rgba(37, 211, 102, 0.3)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {waLoading ? '⏳ Génération...' : '💬 Partager via WhatsApp'}
          </button>

          <button
            onClick={handlePrint}
            style={{
              padding: '10px 22px',
              borderRadius: 8,
              border: 'none',
              background: themeColor,
              color: 'var(--text-inverse)',
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
