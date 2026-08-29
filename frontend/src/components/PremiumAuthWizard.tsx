import { StorageService } from '../services/storage';
import React, { useState } from 'react';

export enum SectorType {
  QUINCAILLERIE = 'QUINCAILLERIE',
  MULTISERVICES_IT = 'MULTISERVICES_IT',
  TAILLEUR = 'TAILLEUR',
}

// ─── Icône Quincaillerie : Clés croisées + marteau style illustré ───
const IconQuincaillerie = () => (
  <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Fond circulaire doux */}
    <circle cx="45" cy="45" r="40" fill="#FBF3E0" />
    {/* Corps clé n°1 */}
    <rect x="22" y="40" width="46" height="10" rx="5" fill="#C8922A" transform="rotate(-45 45 45)" />
    <circle cx="30" cy="30" r="9" fill="#C8922A" />
    <circle cx="30" cy="30" r="5" fill="#FBF3E0" />
    <circle cx="60" cy="60" r="7" fill="#C8922A" />
    <circle cx="60" cy="60" r="3.5" fill="#FBF3E0" />
    {/* Corps clé n°2 croisée */}
    <rect x="22" y="40" width="46" height="10" rx="5" fill="#E0A830" transform="rotate(45 45 45)" />
    <circle cx="60" cy="30" r="9" fill="#E0A830" />
    <circle cx="60" cy="30" r="5" fill="#FBF3E0" />
    <circle cx="30" cy="60" r="7" fill="#E0A830" />
    <circle cx="30" cy="60" r="3.5" fill="#FBF3E0" />
    {/* Brique centrale */}
    <rect x="38" y="38" width="14" height="14" rx="3" fill="#A06820" />
  </svg>
);

// ─── Icône Multiservices IT : Écran + Tour d'ordinateur ───
const IconMultiservicesIT = () => (
  <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Fond circulaire doux */}
    <circle cx="45" cy="45" r="40" fill="#E6F3F1" />
    {/* Écran moniteur */}
    <rect x="10" y="20" width="45" height="33" rx="4" fill="#2A7A6F" />
    <rect x="13" y="23" width="39" height="26" rx="2" fill="#E6F3F1" />
    {/* Pied écran */}
    <rect x="27" y="53" width="11" height="7" rx="1" fill="#2A7A6F" />
    <rect x="22" y="59" width="21" height="3" rx="1.5" fill="#2A7A6F" />
    {/* Câble */}
    <path d="M55 57 Q65 55 65 45" stroke="#2A7A6F" strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* Tour / Boîtier */}
    <rect x="60" y="22" width="18" height="38" rx="4" fill="#1F6055" />
    <rect x="63" y="26" width="12" height="8" rx="2" fill="#E6F3F1" opacity="0.6" />
    <circle cx="69" cy="52" r="3" fill="#2A7A6F" />
    <rect x="63" y="56" width="12" height="2.5" rx="1.25" fill="#E6F3F1" opacity="0.4" />
    {/* Reflet écran */}
    <rect x="16" y="26" width="14" height="2" rx="1" fill="#2A7A6F" opacity="0.3" />
    <rect x="16" y="31" width="20" height="2" rx="1" fill="#2A7A6F" opacity="0.2" />
  </svg>
);

// ─── Icône Tailleur : Machine à coudre + Mètre ruban ───
const IconTailleur = () => (
  <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Fond circulaire doux */}
    <circle cx="45" cy="45" r="40" fill="#FBF0ED" />
    {/* Corps machine à coudre */}
    <rect x="15" y="38" width="50" height="24" rx="6" fill="#C47A6A" />
    <rect x="18" y="42" width="30" height="14" rx="3" fill="#E8A49A" />
    {/* Bras vertical machine */}
    <rect x="48" y="22" width="12" height="30" rx="6" fill="#C47A6A" />
    {/* Aiguille */}
    <rect x="52" y="45" width="3" height="14" rx="1.5" fill="#A05848" />
    <ellipse cx="53.5" cy="59" rx="2" ry="3" fill="#7A3828" />
    {/* Bobine */}
    <circle cx="56" cy="28" r="7" fill="#E8A49A" />
    <circle cx="56" cy="28" r="4" fill="#C47A6A" />
    {/* Base */}
    <rect x="12" y="60" width="56" height="6" rx="3" fill="#A05848" />
    {/* Mètre ruban */}
    <path d="M15 70 Q45 78 75 70" stroke="#E0C080" strokeWidth="5" fill="none" strokeLinecap="round" />
    <rect x="14" y="68" width="10" height="5" rx="1.5" fill="#C8A050" />
    {/* Graduations */}
    <line x1="20" y1="69" x2="20" y2="72" stroke="#FBF3E0" strokeWidth="1" />
    <line x1="26" y1="70" x2="26" y2="72.5" stroke="#FBF3E0" strokeWidth="1" />
    <line x1="32" y1="70.5" x2="32" y2="73" stroke="#FBF3E0" strokeWidth="1" />
  </svg>
);

// ─── Secteur Configs Enrichies avec Contenu Commercial ───
const SECTORS = [
  {
    type: SectorType.QUINCAILLERIE,
    title: 'Quincaillerie',
    shortDesc: 'Gérez votre stock, vos ventes et vos devis avec précision.',
    features: [
      'Produits & catalogue',
      'Stocks & mouvements',
      'Alertes de stock',
      'Ventes & clients',
      'Devis & factures',
      'Achats & fournisseurs',
    ],
    valueText: 'Réduisez les ruptures de stock et pilotez votre activité avec une meilleure visibilité.',
    borderColor: '#C8922A',
    shadowColor: 'rgba(200, 146, 42, 0.25)',
    accentBg: '#FFFDF9',
    icon: <IconQuincaillerie />,
  },
  {
    type: SectorType.MULTISERVICES_IT,
    title: 'Multiservices Informatiques',
    shortDesc: 'Centralisez vos réparations, ventes de matériel et prestations informatiques.',
    features: [
      'Clients',
      'Réparations',
      'Interventions',
      'Matériel informatique',
      'Prestations',
      'Devis & factures',
    ],
    valueText: 'Suivez chaque client, chaque équipement et chaque intervention depuis un espace unique.',
    borderColor: '#2A7A6F',
    shadowColor: 'rgba(42, 122, 111, 0.25)',
    accentBg: '#F7FCFC',
    icon: <IconMultiservicesIT />,
  },
  {
    type: SectorType.TAILLEUR,
    title: 'Tailleur',
    shortDesc: 'Organisez votre atelier et suivez chaque commande de la prise de mesures à la livraison.',
    features: [
      'Clients',
      'Mesures',
      'Rendez-vous',
      'Commandes',
      'Projets de couture',
      'Livraisons',
    ],
    valueText: 'Respectez vos délais, organisez votre atelier et fidélisez votre clientèle.',
    borderColor: '#C47A6A',
    shadowColor: 'rgba(196, 122, 106, 0.25)',
    accentBg: '#FFFBFB',
    icon: <IconTailleur />,
  },
];

// ─── Composant Carte Secteur Optimisé UX/UI ───
interface SectorCardProps {
  sector: typeof SECTORS[0];
  isSelected: boolean;
  onSelect: () => void;
}

const SectorCardComponent: React.FC<SectorCardProps> = ({ sector, isSelected, onSelect }) => {
  return (
    <div
      role="radio"
      aria-checked={isSelected}
      aria-label={`Sélectionner le secteur ${sector.title}`}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect())}
      className={`sector-card card-inner-pattern${isSelected ? ' selected' : ''}`}
      style={{
        background: isSelected ? sector.accentBg : 'white',
        borderRadius: '18px',
        border: isSelected ? `2.5px solid ${sector.borderColor}` : `1.5px solid ${sector.borderColor}40`,
        boxShadow: isSelected
          ? `0 16px 36px ${sector.shadowColor}, 0 4px 14px rgba(0,0,0,0.06)`
          : `0 4px 16px rgba(0,0,0,0.04)`,
        padding: '28px 24px 24px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'left',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
      }}
    >
      {/* Badge Sélectionné Clair & Professionnel */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: 14,
          right: 14,
          padding: '4px 10px',
          borderRadius: '20px',
          background: sector.borderColor,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: 'white',
          fontSize: '0.72rem',
          fontWeight: 800,
          boxShadow: `0 2px 8px ${sector.shadowColor}`,
        }}>
          <span>✓</span> Secteur choisi
        </div>
      )}

      {/* En-tête de la Carte (Icône + Titre) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>
        <div>{sector.icon}</div>
        <h3 className="force-dark-text" style={{
          fontFamily: "'Sora', sans-serif",
          fontWeight: 800,
          fontSize: '1.2rem',
          lineHeight: 1.25,
        }}>
          {sector.title}
        </h3>
        <p className="force-gray-text" style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 500,
          fontSize: '0.84rem',
          lineHeight: 1.5,
          margin: '0 auto',
        }}>
          {sector.shortDesc}
        </p>
      </div>

      {/* Ligne de séparation fine */}
      <div style={{ width: '100%', height: '1px', background: `${sector.borderColor}25`, margin: '2px 0' }} />

      {/* Liste des 6 Fonctionnalités Principales */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '7px' }}>
        <span className="force-gray-text" style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
          Fonctionnalités clés :
        </span>
        {sector.features.map((feat, idx) => (
          <div key={idx} className="force-gray-dark-text" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.83rem', fontWeight: 600 }}>
            <span style={{ color: sector.borderColor, fontWeight: 800, fontSize: '0.9rem' }}>✓</span>
            <span>{feat}</span>
          </div>
        ))}
      </div>

      {/* Phrase de valeur ajoutée SaaS */}
      <div style={{
        marginTop: 'auto',
        width: '100%',
        padding: '10px 12px',
        borderRadius: '10px',
        background: isSelected ? 'white' : '#F9FAFB',
        border: `1px solid ${sector.borderColor}30`,
        fontSize: '0.78rem',
        color: '#4A5568',
        lineHeight: 1.45,
        fontWeight: 500,
        fontStyle: 'italic',
        textAlign: 'center',
      }}>
        « {sector.valueText} »
      </div>
    </div>
  );
};


// ─── Composant Bouton Principal ───
const RegisterButton: React.FC<{ isDisabled: boolean; onClick: () => void }> = ({ isDisabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={isDisabled}
    style={{
      padding: '14px 48px',
      borderRadius: '10px',
      background: isDisabled ? '#B0B8B4' : '#1C4A34',
      color: isDisabled ? '#8A9A94' : 'white',
      border: 'none',
      fontFamily: "'Sora', sans-serif",
      fontWeight: 700,
      fontSize: '0.95rem',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      letterSpacing: '0.02em',
      transition: 'all 200ms ease',
      boxShadow: isDisabled ? 'none' : '0 4px 18px rgba(28, 74, 52, 0.35)',
      transform: isDisabled ? 'none' : 'translateY(0)',
      opacity: isDisabled ? 0.65 : 1,
    }}
    onMouseEnter={(e) => {
      if (!isDisabled) {
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 28px rgba(28, 74, 52, 0.45)';
      }
    }}
    onMouseLeave={(e) => {
      if (!isDisabled) {
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 18px rgba(28, 74, 52, 0.35)';
      }
    }}
  >
    S'inscrire maintenant
  </button>
);

// ─── Composant Principal ───
export const PremiumAuthWizard: React.FC = () => {
  const [mode, setMode] = useState<'selection' | 'signup' | 'login' | 'otp-confirm' | 'totp-confirm'>('selection');
  const [selectedSector, setSelectedSector] = useState<SectorType | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    managerName: '',
    phone: '',
    country: 'SN',
    email: '',
    password: '',
    identifier: '',
    tempToken: '',
    totpCode: '',
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showTotpStep, setShowTotpStep] = useState(false);
  const [totpTempToken, setTotpTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpError, setTotpError] = useState<string | null>(null);
  const [totpLoading, setTotpLoading] = useState(false);

  // ─── Handler d'enregistrement vers le backend ───
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError(null);
    try {
      const payload = {
        sectorType: selectedSector,
        companyName: formData.companyName,
        managerName: formData.managerName,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        password: formData.password,
      };

      const { ApiClient } = await import('../services/api-client');
      await ApiClient.post('/api/auth/register/init', payload, true);
      
      setMode('otp-confirm');
    } catch (err: any) {
      setRegisterError(err.message);
      alert(`Erreur d'inscription: ${err.message}`);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    setOtpError(null);
    try {
      const { ApiClient } = await import('../services/api-client');
      await ApiClient.post('/api/auth/register/confirm', { email: formData.email, otp }, true);
      
      // Auto login after confirm
      const data: any = await ApiClient.post('/api/auth/login', { 
        identifier: formData.email, 
        password: formData.password 
      }, true);

      await StorageService.set('kpsy_token', data.accessToken);
      localStorage.setItem('kpsy_user', JSON.stringify(data.user));
      if (data.tenant) {
        localStorage.setItem('kpsy_tenant', JSON.stringify(data.tenant));
      }

      const isSuperAdmin = data.user?.roles?.includes('SUPER_ADMIN');
      
      alert(`Compte SaaS créé avec succès ! Bienvenue ${formData.companyName}.`);
      window.dispatchEvent(new CustomEvent('kpsy:login', { detail: { isSuperAdmin } }));
    } catch (err: any) {
      setOtpError(err.message || "Code invalide ou expiré.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError(null);
    try {
      const payload = {
        sectorType: selectedSector,
        companyName: formData.companyName,
        managerName: formData.managerName,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        password: formData.password,
      };
      const { ApiClient } = await import('../services/api-client');
      await ApiClient.post('/api/auth/register/init', payload, true);
      alert('Un nouveau code a été envoyé à votre adresse email.');
    } catch (err: any) {
      setOtpError(err.message || 'Erreur lors du renvoi du code.');
    }
  };

  // ─── Handler de connexion réelle vers le backend ───
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    setLoginSuccess(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data?.message || 'Adresse e-mail, code tenant ou mot de passe incorrect.');
        return;
      }

      if (data.requiresTotp) {
        setTotpTempToken(data.tempToken);
        setShowTotpStep(true);
        return;
      }

      // Stocker le token JWT
      await StorageService.set('kpsy_token', data.accessToken);
      localStorage.setItem('kpsy_user', JSON.stringify(data.user));
      localStorage.setItem('kpsy_tenant', JSON.stringify(data.tenant));

      const isSuperAdmin = data.user?.roles?.includes('SUPER_ADMIN');
      setLoginSuccess(`Bienvenue ${data.user?.username} — Connexion réussie !`);

      // Naviguer sans rechargement via CustomEvent
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('kpsy:login', { detail: { isSuperAdmin } }));
      }, 800);

    } catch (err) {
      setLoginError('Erreur réseau — Le serveur backend est-il démarré ? (port 3003)');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setTotpLoading(true);
    setTotpError(null);
    setLoginSuccess(null);
    
    try {
      const res = await fetch('/api/auth/login/verify-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempToken: totpTempToken,
          code: totpCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTotpError(data?.message || 'Code 2FA incorrect.');
        return;
      }

      // Stocker le token JWT
      await StorageService.set('kpsy_token', data.accessToken);
      localStorage.setItem('kpsy_user', JSON.stringify(data.user));
      if (data.tenant) {
        localStorage.setItem('kpsy_tenant', JSON.stringify(data.tenant));
      }

      const isSuperAdmin = data.user?.roles?.includes('SUPER_ADMIN');
      setLoginSuccess(`Bienvenue ${data.user?.username} — Connexion réussie !`);

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('kpsy:login', { detail: { isSuperAdmin } }));
      }, 800);

    } catch (err) {
      setTotpError('Erreur réseau.');
    } finally {
      setTotpLoading(false);
    }
  };

  return (
    <div
      className="bg-african-pattern"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 20px',
      }}
    >
      {/* ─── Header ─── */}
      <header style={{
        width: '100%',
        maxWidth: '1180px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#1C4A34', color: '#C8922A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 16,
            border: '1.5px solid rgba(200, 146, 42, 0.4)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>K</div>
          <span style={{
            fontFamily: "'Sora', sans-serif", fontWeight: 800,
            fontSize: '1rem', color: '#1A1A1A',
          }}>
            KPSyDesk <span style={{ color: '#C8922A' }}>Suite - Door Waar (v2.0)</span>
          </span>
        </div>


        <div style={{ display: 'flex', gap: 8 }}>
          {['selection', 'login'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m as 'selection' | 'login')}
              style={{
                padding: '7px 18px', borderRadius: 20,
                background: mode === m ? '#1C4A34' : 'white',
                color: mode === m ? 'white' : '#4A5568',
                border: mode === m ? 'none' : '1px solid #CBD5E1',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                transition: 'all 200ms ease',
                boxShadow: mode === m ? '0 2px 8px rgba(28,74,52,0.2)' : 'none',
              }}
            >
              {m === 'selection' ? 'Sélection Secteur' : 'Se Connecter'}
            </button>
          ))}
        </div>
      </header>

      {/* ─── ÉCRAN DE SÉLECTION ─── */}
      {mode === 'selection' && (
        <main style={{
          width: '100%', maxWidth: '1180px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 32, flex: 1,
          justifyContent: 'center', padding: '16px 0 24px',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
            gap: 24,
            width: '100%',
          }}>
            {SECTORS.map((s) => (
              <SectorCardComponent
                key={s.type}
                sector={s}
                isSelected={selectedSector === s.type}
                onSelect={() => setSelectedSector(s.type)}
              />
            ))}
          </div>
          <RegisterButton isDisabled={!selectedSector} onClick={() => selectedSector && setMode('signup')} />
        </main>
      )}


      {/* ─── FORMULAIRE INSCRIPTION ÉTAPE 2 ─── */}
      {mode === 'signup' && (
        <main style={{
          width: '100%', maxWidth: 520, flex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'white', borderRadius: 20,
            padding: '36px 32px', width: '100%',
            boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <button onClick={() => setMode('selection')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.8rem', color: '#1C4A34',
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
              }}>← Changer de secteur</button>
              <span style={{
                background: '#F0F7F4', color: '#1C4A34',
                padding: '4px 12px', borderRadius: 20,
                fontSize: '0.72rem', fontWeight: 700, border: '1px solid #C0DDD4',
              }}>
                {selectedSector}
              </span>
            </div>

            <h2 style={{
              fontFamily: "'Sora', sans-serif", fontWeight: 800,
              fontSize: '1.4rem', color: '#1A1A1A', marginBottom: 6, textAlign: 'center',
            }}>Finaliser votre inscription</h2>
            <p style={{ textAlign: 'center', color: '#666', fontSize: '0.8rem', marginBottom: 24 }}>
              Essai gratuit 7 jours — Zone UEMOA
            </p>

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: "Nom de l'entreprise / Atelier", key: 'companyName', placeholder: 'ex: Quincaillerie Al-Baraka', type: 'text' },
                { label: 'Nom du gérant', key: 'managerName', placeholder: 'Khalil NDIAYE', type: 'text' },
                { label: 'Téléphone', key: 'phone', placeholder: '77 000 00 00', type: 'tel' },
                { label: 'Email', key: 'email', placeholder: 'gerant@entreprise.sn', type: 'email' },
                { label: 'Mot de passe', key: 'password', placeholder: '••••••••', type: 'password' },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#444', marginBottom: 5 }}>{label}</label>
                  <input
                    type={type}
                    required
                    placeholder={placeholder}
                    value={formData[key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1.5px solid #E0E0E0', fontSize: '0.85rem',
                      color: '#1A1A1A', outline: 'none',
                      transition: 'border-color 200ms ease',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#1C4A34')}
                    onBlur={(e) => (e.target.style.borderColor = '#E0E0E0')}
                  />
                </div>
              ))}
              
              {registerError && (
                <div style={{ color: '#E53E3E', fontSize: '0.8rem', textAlign: 'center', background: '#FFF5F5', padding: '8px', borderRadius: '6px' }}>
                  {registerError}
                </div>
              )}

              <button
                type="submit"
                disabled={registerLoading}
                style={{
                  background: registerLoading ? '#A0AEC0' : '#1C4A34',
                  color: 'white', border: 'none',
                  padding: '12px', borderRadius: 10,
                  fontSize: '0.85rem', fontWeight: 800, marginTop: 10,
                  cursor: registerLoading ? 'not-allowed' : 'pointer',
                  boxShadow: registerLoading ? 'none' : '0 4px 15px rgba(28,74,52,0.25)',
                  transition: 'all 200ms ease',
                }}
              >
                {registerLoading ? 'Création en cours...' : 'Valider et démarrer l’essai 7 jours →'}
              </button>
            </form>
          </div>
        </main>
      )}

      {/* ─── ÉCRAN CONFIRMATION OTP ─── */}
      {mode === 'otp-confirm' && (
        <main style={{
          width: '100%', maxWidth: 520, flex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'white', borderRadius: 20,
            padding: '36px 32px', width: '100%',
            boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <button onClick={() => setMode('signup')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.8rem', color: '#1C4A34',
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
              }}>← Retour</button>
            </div>

            <h2 style={{
              fontFamily: "'Sora', sans-serif", fontWeight: 800,
              fontSize: '1.4rem', color: '#1A1A1A', marginBottom: 6, textAlign: 'center',
            }}>Vérification de l'email</h2>
            <p style={{ textAlign: 'center', color: '#666', fontSize: '0.8rem', marginBottom: 24 }}>
              Un code à 6 chiffres a été envoyé à <strong>{formData.email}</strong>
            </p>

            <form onSubmit={handleConfirmOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    if (otpError) setOtpError(null);
                  }}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 10,
                    border: '1.5px solid #E0E0E0', fontSize: '1.5rem',
                    color: '#1A1A1A', outline: 'none', textAlign: 'center',
                    letterSpacing: '0.5em',
                    transition: 'border-color 200ms ease',
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#1C4A34')}
                  onBlur={(e) => (e.target.style.borderColor = '#E0E0E0')}
                />
              </div>
              
              {otpError && (
                <div style={{ color: '#E53E3E', fontSize: '0.8rem', textAlign: 'center', background: '#FFF5F5', padding: '8px', borderRadius: '6px' }}>
                  {otpError}
                </div>
              )}

              <button
                type="submit"
                disabled={otpLoading || otp.length < 6}
                style={{
                  background: (otpLoading || otp.length < 6) ? '#A0AEC0' : '#1C4A34',
                  color: 'white', border: 'none',
                  padding: '12px', borderRadius: 10,
                  fontSize: '0.85rem', fontWeight: 800, marginTop: 10,
                  cursor: (otpLoading || otp.length < 6) ? 'not-allowed' : 'pointer',
                  boxShadow: (otpLoading || otp.length < 6) ? 'none' : '0 4px 15px rgba(28,74,52,0.25)',
                  transition: 'all 200ms ease',
                }}
              >
                {otpLoading ? 'Vérification...' : 'Valider le code'}
              </button>
            </form>
            
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                type="button"
                onClick={handleResendOtp}
                style={{ background: 'none', border: 'none', color: '#1C4A34', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Renvoyer le code
              </button>
            </div>
          </div>
        </main>
      )}




      {/* ─── ÉCRAN CONNEXION B2B PREMIUM (Layout Double Zone Desktop) ─── */}
      {mode === 'login' && (
        <main style={{
          width: '100%', maxWidth: '1080px', flex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px 0',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 36,
            width: '100%',
            alignItems: 'center',
          }}>
            {/* Zone Gauche : Présentation Commerciale KPSyDesk Suite */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              padding: '12px 10px',
            }}>
              <div>
                <span style={{
                  background: '#E6F4EA', color: '#1C4A34',
                  padding: '4px 14px', borderRadius: 20,
                  fontSize: '0.74rem', fontWeight: 800,
                  border: '1px solid #A7F3D0',
                  letterSpacing: '0.03em', display: 'inline-block', marginBottom: 12,
                }}>
                  SaaS Multi-Secteurs B2B — Zone UEMOA
                </span>
                <h1 style={{
                  fontFamily: "'Sora', sans-serif", fontWeight: 800,
                  fontSize: '2rem', color: '#111827', lineHeight: 1.25,
                  marginBottom: 10,
                }}>
                  Bienvenue sur <br />
                  <span style={{ color: '#1C4A34' }}>KPSyDesk Suite</span> <span style={{ color: '#C8922A' }}>- Door Waar</span>
                </h1>

                <p style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '0.92rem', color: '#4B5563', lineHeight: 1.6,
                }}>
                  La solution SaaS qui simplifie la gestion quotidienne de votre activité. Un espace professionnel unique pour piloter vos clients, vos ventes et vos opérations.
                </p>
              </div>

              {/* Présentation discrète des 3 secteurs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Solution métiers intégrée :
                </span>
                {[
                  { title: '🔩 Quincaillerie', desc: 'Stocks, ventes, achats, fournisseurs et facturation.' },
                  { title: '💻 Multiservices IT', desc: 'Réparations, équipements, interventions, prestations et clients.' },
                  { title: '✂️ Tailleur & Confection', desc: 'Clients, mesures, rendez-vous, commandes et livraisons.' },
                ].map((s, idx) => (
                  <div key={idx} style={{
                    background: 'white', padding: '10px 14px', borderRadius: 12,
                    border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 2,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}>
                    <strong style={{ fontSize: '0.82rem', color: '#1F2937' }}>{s.title}</strong>
                    <span style={{ fontSize: '0.76rem', color: '#6B7280' }}>{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Zone Droite : Formulaire de Connexion Carte Premium */}
            <div style={{
              background: 'white', borderRadius: 20,
              padding: '36px 32px', width: '100%',
              boxShadow: '0 16px 40px rgba(0,0,0,0.07)',
              border: '1px solid #E5E7EB',
              position: 'relative',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <button
                  onClick={() => setMode('selection')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.8rem', color: '#1C4A34',
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  ← Changer de secteur
                </button>
                <span style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600 }}>Espace Sécurisé</span>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h2 style={{
                  fontFamily: "'Sora', sans-serif", fontWeight: 800,
                  fontSize: '1.35rem', color: '#111827', marginBottom: 4,
                }}>
                  Connectez-vous à votre espace
                </h2>
                <p style={{ color: '#6B7280', fontSize: '0.82rem' }}>
                  Renseignez vos identifiants pour accéder au tableau de bord
                </p>
              </div>

              {/* Messages d'état stylisés */}

              {loginError && (
                <div style={{
                  background: '#FEF2F2', border: '1px solid #FCA5A5',
                  borderRadius: 10, padding: '10px 14px',
                  color: '#DC2626', fontSize: '0.8rem', fontWeight: 600,
                  marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span>⚠️</span> {loginError}
                </div>
              )}
              {loginSuccess && (
                <div style={{
                  background: '#F0FDF4', border: '1px solid #86EFAC',
                  borderRadius: 10, padding: '10px 14px',
                  color: '#16A34A', fontSize: '0.8rem', fontWeight: 600,
                  marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span>✅</span> {loginSuccess}
                </div>
              )}

              {showTotpStep ? (
                <form onSubmit={handleVerifyTotp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {totpError && (
                    <div style={{
                      background: '#FEF2F2', border: '1px solid #FCA5A5',
                      borderRadius: 10, padding: '10px 14px',
                      color: '#DC2626', fontSize: '0.8rem', fontWeight: 600,
                      marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span>⚠️</span> {totpError}
                    </div>
                  )}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                      Code de sécurité à 6 chiffres
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 123456"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.trim())}
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: 10,
                        border: '1.5px solid #D1D5DB', fontSize: '0.88rem',
                        color: '#111827', outline: 'none',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        transition: 'border-color 200ms ease, box-shadow 200ms ease',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => { setShowTotpStep(false); setTotpCode(''); }}
                      disabled={totpLoading}
                      style={{
                        flex: 1, padding: '13px', borderRadius: 10,
                        background: 'white', color: '#374151', border: '1px solid #D1D5DB',
                        fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '0.92rem',
                        cursor: totpLoading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={totpLoading || !totpCode}
                      style={{
                        flex: 2, padding: '13px', borderRadius: 10,
                        background: (totpLoading || !totpCode) ? '#9CA3AF' : '#1C4A34',
                        color: 'white', border: 'none',
                        fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '0.92rem',
                        cursor: (totpLoading || !totpCode) ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {totpLoading ? 'Vérification...' : 'Valider'}
                    </button>
                  </div>
                </form>
              ) : (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Champ Identifiant */}
                <div>
                  <label htmlFor="login-identifier" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                    Identifiant (Code Tenant ou Email)
                  </label>
                  <input
                    id="login-identifier"
                    type="text"
                    required
                    placeholder="ex: QNC-0001-01 ou gerant@entreprise.sn"
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: 10,
                      border: '1.5px solid #D1D5DB', fontSize: '0.88rem',
                      color: '#111827', outline: 'none',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      transition: 'border-color 200ms ease, box-shadow 200ms ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1C4A34';
                      e.target.style.boxShadow = '0 0 0 3px rgba(28, 74, 52, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#D1D5DB';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Champ Mot de Passe avec Bascule Afficher/Masquer */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label htmlFor="login-password" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>
                      Mot de passe
                    </label>
                    <button
                      type="button"
                      onClick={() => alert('Veuillez contacter le Gérant de votre Tenant ou le Super Admin pour réinitialiser votre mot de passe.')}
                      style={{ background: 'none', border: 'none', color: '#1C4A34', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      style={{
                        width: '100%', padding: '11px 40px 11px 14px', borderRadius: 10,
                        border: '1.5px solid #D1D5DB', fontSize: '0.88rem',
                        color: '#111827', outline: 'none',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        transition: 'border-color 200ms ease, box-shadow 200ms ease',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#1C4A34';
                        e.target.style.boxShadow = '0 0 0 3px rgba(28, 74, 52, 0.12)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#D1D5DB';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: 12, background: 'none', border: 'none',
                        cursor: 'pointer', fontSize: '1.1rem', color: '#6B7280', padding: 4,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {/* Bouton Principal de Soumission */}
                <button
                  type="submit"
                  disabled={loginLoading}
                  style={{
                    marginTop: 6, padding: '13px', borderRadius: 10,
                    background: loginLoading ? '#9CA3AF' : '#1C4A34',
                    color: 'white', border: 'none',
                    fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '0.92rem',
                    cursor: loginLoading ? 'not-allowed' : 'pointer',
                    boxShadow: loginLoading ? 'none' : '0 4px 18px rgba(28,74,52,0.3)',
                    transition: 'all 200ms ease',
                    opacity: loginLoading ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!loginLoading) e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    if (!loginLoading) e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {loginLoading ? 'Connexion en cours...' : 'Se connecter →'}
                </button>
              </form>
              )}

              {/* Zone Créer un Compte */}
              <div style={{
                textAlign: 'center', marginTop: 20, paddingTop: 16,
                borderTop: '1px solid #F3F4F6', fontSize: '0.8rem', color: '#6B7280',
              }}>
                Vous n'avez pas encore de compte ?{' '}
                <span
                  onClick={() => setMode('selection')}
                  style={{ color: '#1C4A34', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Créer votre espace professionnel
                </span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ─── Footer ─── */}
      <footer style={{
        textAlign: 'center', fontSize: '0.74rem',
        color: '#6B7280', paddingTop: 16,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        © 2026 KPSyDesk Suite - Door Waar — Solution Multi-Secteurs UEMOA

      </footer>
    </div>
  );
};


