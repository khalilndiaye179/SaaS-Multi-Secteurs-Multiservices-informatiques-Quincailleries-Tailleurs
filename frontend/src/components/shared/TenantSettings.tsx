import React, { useState, useEffect } from 'react';
import { CompanyHeaderDetails } from './DocumentPrintModal';

interface Props {
  tenantName: string;
  tenantCode: string;
  sector: string;
  themeColor: string;
}

export const TenantSettings: React.FC<Props> = ({ tenantName, tenantCode, sector, themeColor }) => {
  const [address, setAddress] = useState('Avenue Léopold Sédar Senghor, Dakar, Sénégal');
  const [phone, setPhone] = useState('+221 33 800 00 00');
  const [email, setEmail] = useState('contact@entreprise-uemoa.sn');
  const [nineaRccm, setNineaRccm] = useState('NINEA: 001234567 2V3 / RCCM: SN-DKR-2026-B-1234');
  const [enableTva, setEnableTva] = useState(true);
  const [tvaRate, setTvaRate] = useState(18);
  const [logoSvg, setLogoSvg] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  // Clé d'isolation par tenant (ex: kpsy_company_settings_QNC-0001-01)
  const settingsStorageKey = `kpsy_company_settings_${tenantCode || 'default'}`;

  // Charger les paramètres enregistrés au montage
  useEffect(() => {
    const savedStr = localStorage.getItem(settingsStorageKey);
    if (savedStr) {
      try {
        const saved: CompanyHeaderDetails = JSON.parse(savedStr);
        setAddress(saved.address || '');
        setPhone(saved.phone || '');
        setEmail(saved.email || '');
        setNineaRccm(saved.nineaRccm || '');
        setEnableTva(saved.enableTva ?? true);
        setTvaRate(saved.tvaRate || 18);
        setLogoSvg(saved.logoSvg || '');
      } catch (e) {
        console.error(e);
      }
    } else {
      // Réinitialiser les champs si aucun paramètre n'existe pour ce tenant
      setAddress('Avenue Léopold Sédar Senghor, Dakar, Sénégal');
      setPhone('+221 33 800 00 00');
      setEmail('contact@entreprise-uemoa.sn');
      setNineaRccm('NINEA: 001234567 2V3 / RCCM: SN-DKR-2026-B-1234');
      setEnableTva(true);
      setTvaRate(18);
      setLogoSvg('');
    }
  }, [tenantCode]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const settings: CompanyHeaderDetails = {
      tenantName,
      tenantCode,
      address,
      phone,
      email,
      nineaRccm,
      enableTva,
      tvaRate,
      logoSvg,
    };

    localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
    setSavedMsg('Paramètres d\'en-tête et TVA enregistrés avec succès !');
    setTimeout(() => setSavedMsg(''), 4000);
  };


  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.includes('svg') || file.name.endsWith('.svg')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setLogoSvg(content);
      };
      reader.readAsText(file);
    } else if (file.type.includes('image')) {
      // Conversion PNG / JPEG / WEBP vers SVG Wrapper Base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const w = img.width || 200;
          const h = img.height || 200;
          const generatedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n  <image href="${dataUrl}" x="0" y="0" width="${w}" height="${h}"/>\n</svg>`;


          setLogoSvg(generatedSvg);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: '#111827' }}>
          Paramètres de l'Entreprise & En-tête des Documents
        </h2>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
          Personnalisation du logo SVG, des coordonnées fiscales et de la TVA optionnelle pour vos factures et devis PDF
        </p>
      </div>

      {savedMsg && (
        <div style={{ padding: 14, background: '#D1FAE5', color: '#065F46', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem' }}>
          ✓ {savedMsg}
        </div>
      )}

      <form onSubmit={handleSaveSettings} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Colonne 1 : Coordonnées Officielles */}
        <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Coordonnées Officielle & Identifiants</h3>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Nom de l'Établissement</label>
            <input disabled value={tenantName} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #E5E7EB', background: '#F9FAFB', fontWeight: 700 }} />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Adresse Physique Complete</label>
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ex: Rue 14 x Boulevard de la République, Dakar"
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB', fontWeight: 500 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Téléphone Officiel</label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+221 33 800 00 00"
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Email de Contact</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@societe.sn"
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Numéro NINEA / RCCM / IFU (Fiscalité)</label>
            <input
              value={nineaRccm}
              onChange={(e) => setNineaRccm(e.target.value)}
              placeholder="ex: NINEA: 001234567 2V3 / RCCM: SN-DKR-2026-B-1234"
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB', fontWeight: 600 }}
            />
          </div>
        </div>

        {/* Colonne 2 : Logo SVG & Config TVA */}
        <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Logo SVG & Option TVA</h3>

          {/* Upload Logo SVG / Image */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>
              Logo d'Entreprise (.PNG, .JPEG, .WEBP ou .SVG) — Auto-Converti en SVG
            </label>
            <input type="file" accept=".png,.jpeg,.jpg,.webp,.svg,image/*" onChange={handleLogoFileUpload} style={{ fontSize: '0.8rem', marginBottom: 8 }} />


            <textarea
              rows={4}
              value={logoSvg}
              onChange={(e) => setLogoSvg(e.target.value)}
              placeholder="Collerez ici votre code SVG <svg>...</svg> ou chargez un fichier .svg"
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #D1D5DB', fontFamily: 'monospace', fontSize: '0.75rem' }}
            />

            {/* Aperçu Logo & Bouton Purge */}
            {logoSvg && (
              <div style={{ marginTop: 8, padding: 12, background: '#F9FAFB', border: '1px dashed #D1D5DB', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 700, marginBottom: 4 }}>Aperçu du Logo Actuel :</div>
                  <div style={{ maxWidth: 140, maxHeight: 50 }} dangerouslySetInnerHTML={{ __html: logoSvg }} />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLogoSvg('');
                    const savedStr = localStorage.getItem(settingsStorageKey);
                    if (savedStr) {
                      const saved = JSON.parse(savedStr);
                      saved.logoSvg = '';
                      localStorage.setItem(settingsStorageKey, JSON.stringify(saved));
                    }
                    alert('Logo purgé avec succès !');

                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#FEE2E2',
                    color: '#DC2626',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🗑️ Purger / Supprimer Logo
                </button>
              </div>
            )}

          </div>

          {/* Configuration TVA Optionnelle */}
          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', color: '#111827' }}>
              <input type="checkbox" checked={enableTva} onChange={(e) => setEnableTva(e.target.checked)} style={{ width: 18, height: 18 }} />
              Activer la Gestion de la TVA sur les Devis et Factures
            </label>

            {enableTva && (
              <div style={{ marginTop: 10, paddingLeft: 28 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Taux de TVA Applicabilité (%)</label>
                <input
                  type="number"
                  value={tvaRate}
                  onChange={(e) => setTvaRate(Number(e.target.value))}
                  style={{ width: 120, padding: 8, borderRadius: 6, border: '1px solid #D1D5DB', fontWeight: 700 }}
                />
                <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#6B7280' }}>Default UEMOA : 18%</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            style={{
              padding: 12,
              borderRadius: 8,
              border: 'none',
              background: themeColor,
              color: 'white',
              fontWeight: 800,
              cursor: 'pointer',
              marginTop: 'auto',
              boxShadow: `0 4px 12px ${themeColor}30`,
            }}
          >
            Enregistrer les Paramètres d'En-tête ✓
          </button>
        </div>
      </form>
    </div>
  );
};
