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
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankGuichet, setBankGuichet] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankRibKey, setBankRibKey] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [bankSwift, setBankSwift] = useState('');
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
        setBankName(saved.bankName || '');
        setBankAccountName(saved.bankAccountName || '');
        setBankCode(saved.bankCode || '');
        setBankGuichet(saved.bankGuichet || '');
        setBankAccountNumber(saved.bankAccountNumber || '');
        setBankRibKey(saved.bankRibKey || '');
        setBankIban(saved.bankIban || '');
        setBankSwift(saved.bankSwift || '');
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
      setBankName('');
      setBankAccountName('');
      setBankCode('');
      setBankGuichet('');
      setBankAccountNumber('');
      setBankRibKey('');
      setBankIban('');
      setBankSwift('');
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
      bankName,
      bankAccountName,
      bankCode,
      bankGuichet,
      bankAccountNumber,
      bankRibKey,
      bankIban,
      bankSwift,
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
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: 0, color: 'var(--text-main)' }}>
          Paramètres de l'Entreprise & En-tête des Documents
        </h2>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
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
        <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Coordonnées Officielle & Identifiants</h3>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Nom de l'Établissement</label>
            <input disabled value={tenantName} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-main)', fontWeight: 700 }} />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Adresse Physique Complete</label>
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ex: Rue 14 x Boulevard de la République, Dakar"
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', fontWeight: 500 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Téléphone Officiel</label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+221 33 800 00 00"
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Email de Contact</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@societe.sn"
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Numéro NINEA / RCCM / IFU (Fiscalité)</label>
            <input
              value={nineaRccm}
              onChange={(e) => setNineaRccm(e.target.value)}
              placeholder="ex: NINEA: 001234567 2V3 / RCCM: SN-DKR-2026-B-1234"
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', fontWeight: 600 }}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14, marginTop: 10 }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>🏦 Coordonnées Bancaires (RIB)</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Nom de la Banque</label>
                <input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="ex: CORIS BANK INTERNATIONAL"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Titulaire du Compte</label>
                <input
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder="ex: AL AMINE BRAIN TECH"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Code Banque</label>
                <input
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  placeholder="SN213"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border-color)', fontSize: '0.8rem', textAlign: 'center' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Code Guichet</label>
                <input
                  value={bankGuichet}
                  onChange={(e) => setBankGuichet(e.target.value)}
                  placeholder="01012"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border-color)', fontSize: '0.8rem', textAlign: 'center' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>N° de Compte</label>
                <input
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="007870024101"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Clé RIB</label>
                <input
                  value={bankRibKey}
                  onChange={(e) => setBankRibKey(e.target.value)}
                  placeholder="03"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border-color)', fontSize: '0.8rem', textAlign: 'center' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Code IBAN</label>
                <input
                  value={bankIban}
                  onChange={(e) => setBankIban(e.target.value)}
                  placeholder="ex: SN21 3010 1200 7870 0241 0103"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Code SWIFT / BIC</label>
                <input
                  value={bankSwift}
                  onChange={(e) => setBankSwift(e.target.value)}
                  placeholder="ex: CORISNDA"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Colonne 2 : Logo SVG & Config TVA */}
        <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Logo SVG & Option TVA</h3>

          {/* Upload Logo SVG / Image */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Logo d'Entreprise (.PNG, .JPEG, .WEBP ou .SVG) — Auto-Converti en SVG
            </label>
            <input type="file" accept=".png,.jpeg,.jpg,.webp,.svg,image/*" onChange={handleLogoFileUpload} style={{ fontSize: '0.8rem', marginBottom: 8 }} />


            <textarea
              rows={4}
              value={logoSvg}
              onChange={(e) => setLogoSvg(e.target.value)}
              placeholder="Collerez ici votre code SVG <svg>...</svg> ou chargez un fichier .svg"
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '0.75rem' }}
            />

            {/* Aperçu Logo & Bouton Purge */}
            {logoSvg && (
              <div style={{ marginTop: 8, padding: 12, background: 'var(--bg-main)', border: '1px dashed #D1D5DB', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>Aperçu du Logo Actuel :</div>
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
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
              <input type="checkbox" checked={enableTva} onChange={(e) => setEnableTva(e.target.checked)} style={{ width: 18, height: 18 }} />
              Activer la Gestion de la TVA sur les Devis et Factures
            </label>

            {enableTva && (
              <div style={{ marginTop: 10, paddingLeft: 28 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Taux de TVA Applicabilité (%)</label>
                <input
                  type="number"
                  value={tvaRate}
                  onChange={(e) => setTvaRate(Number(e.target.value))}
                  style={{ width: 120, padding: 8, borderRadius: 6, border: '1px solid var(--border-color)', fontWeight: 700 }}
                />
                <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Default UEMOA : 18%</span>
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
              color: 'var(--text-inverse)',
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
