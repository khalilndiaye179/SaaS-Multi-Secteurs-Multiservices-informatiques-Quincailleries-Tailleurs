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

// ─── Secteur Configs ───
const SECTORS = [
  {
    type: SectorType.QUINCAILLERIE,
    title: 'Quincaillerie',
    description: 'Optimisez vos stocks, ventes et devis en toute simplicité.',
    borderColor: '#C8922A',
    shadowColor: 'rgba(200, 146, 42, 0.3)',
    icon: <IconQuincaillerie />,
  },
  {
    type: SectorType.MULTISERVICES_IT,
    title: 'Multiservices Informatiques',
    description: 'Gérez vos réparations, vos ventes de matériel et vos prestations de services.',
    borderColor: '#2A7A6F',
    shadowColor: 'rgba(42, 122, 111, 0.3)',
    icon: <IconMultiservicesIT />,
  },
  {
    type: SectorType.TAILLEUR,
    title: 'Tailleur',
    description: 'Planifiez vos rendez-vous, enregistrez les mesures de vos clients et suivez vos créations.',
    borderColor: '#C47A6A',
    shadowColor: 'rgba(196, 122, 106, 0.3)',
    icon: <IconTailleur />,
  },
];

// ─── Composant Carte Secteur ───
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
        background: 'white',
        borderRadius: '16px',
        border: `2px solid ${sector.borderColor}`,
        boxShadow: isSelected
          ? `0 16px 40px ${sector.shadowColor}, 0 4px 12px rgba(0,0,0,0.08)`
          : `0 4px 16px rgba(0,0,0,0.06)`,
        padding: '40px 28px 36px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '20px',
        minHeight: '340px',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Badge sélectionné */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: 14,
          right: 14,
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: sector.borderColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 12,
          fontWeight: 700,
        }}>✓</div>
      )}

      {/* Icône */}
      <div>{sector.icon}</div>

      {/* Textes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{
          fontFamily: "'Sora', sans-serif",
          fontWeight: 800,
          fontSize: '1.15rem',
          color: '#1A1A1A',
          lineHeight: 1.2,
        }}>
          {sector.title}
        </h3>
        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 500,
          fontSize: '0.85rem',
          color: '#5A5A5A',
          lineHeight: 1.6,
          maxWidth: '220px',
          margin: '0 auto',
        }}>
          {sector.description}
        </p>
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
  const [mode, setMode] = useState<'selection' | 'signup' | 'login'>('selection');
  const [selectedSector, setSelectedSector] = useState<SectorType | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    managerName: '',
    phone: '',
    country: 'SN',
    email: '',
    password: '',
    identifier: '',
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

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
        setLoginError(data?.message || 'Identifiants incorrects. Vérifiez votre code ou email.');
        return;
      }

      // Stocker le token JWT
      localStorage.setItem('kpsy_token', data.accessToken);
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

  return (
    <div
      className="bg-african-pattern"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '28px 20px',
      }}
    >
      {/* ─── Header ─── */}
      <header style={{
        width: '100%',
        maxWidth: '1100px',
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
            KPSyDesk <span style={{ color: '#C8922A' }}>Suite</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {['selection', 'login'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m as 'selection' | 'login')}
              style={{
                padding: '6px 16px', borderRadius: 20,
                background: mode === m ? '#1C4A34' : 'transparent',
                color: mode === m ? 'white' : '#555',
                border: mode === m ? 'none' : '1px solid #ccc',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
            >
              {m === 'selection' ? 'Sélection Secteur' : 'Se Connecter'}
            </button>
          ))}
        </div>
      </header>

      {/* ─── ÉCRAN DE SÉLECTION (100% Maquette) ─── */}
      {mode === 'selection' && (
        <main style={{
          width: '100%', maxWidth: '1100px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 36, flex: 1,
          justifyContent: 'center', paddingBottom: 20,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 28,
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
            boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <button onClick={() => setMode('selection')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.8rem', color: '#777',
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500,
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
            <p style={{ textAlign: 'center', color: '#888', fontSize: '0.78rem', marginBottom: 24 }}>
              Essai gratuit 7 jours — Zone UEMOA
            </p>

            <form onSubmit={(e) => { e.preventDefault(); alert('Inscription réussie !'); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

              <button type="submit" style={{
                marginTop: 8, padding: '13px', borderRadius: 10,
                background: '#1C4A34', color: 'white', border: 'none',
                fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '0.9rem',
                cursor: 'pointer', boxShadow: '0 4px 16px rgba(28,74,52,0.35)',
                transition: 'all 200ms ease',
              }}>
                Valider et démarrer l'essai 7 jours →
              </button>
            </form>
          </div>
        </main>
      )}

      {/* ─── ÉCRAN CONNEXION ─── */}
      {mode === 'login' && (
        <main style={{
          width: '100%', maxWidth: 460, flex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'white', borderRadius: 20,
            padding: '36px 32px', width: '100%',
            boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{
                fontFamily: "'Sora', sans-serif", fontWeight: 800,
                fontSize: '1.4rem', color: '#1A1A1A', marginBottom: 6,
              }}>Espace de Connexion</h2>
              <p style={{ color: '#888', fontSize: '0.78rem' }}>Accédez à votre espace métier sécurisé</p>
            </div>

            {/* Messages d'état */}
            {loginError && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FCA5A5',
                borderRadius: 10, padding: '10px 14px',
                color: '#DC2626', fontSize: '0.78rem', fontWeight: 600,
                marginBottom: 4,
              }}>
                ⚠️ {loginError}
              </div>
            )}
            {loginSuccess && (
              <div style={{
                background: '#F0FDF4', border: '1px solid #86EFAC',
                borderRadius: 10, padding: '10px 14px',
                color: '#16A34A', fontSize: '0.78rem', fontWeight: 600,
                marginBottom: 4,
              }}>
                ✅ {loginSuccess}
              </div>
            )}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Identifiant (Code Tenant ou Email)', key: 'identifier', placeholder: 'QNC-0001-01 ou gerant@entreprise.sn', type: 'text' },
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
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#1C4A34')}
                    onBlur={(e) => (e.target.style.borderColor = '#E0E0E0')}
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={loginLoading}
                style={{
                  marginTop: 8, padding: '13px', borderRadius: 10,
                  background: loginLoading ? '#6B7280' : '#1C4A34',
                  color: 'white', border: 'none',
                  fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '0.9rem',
                  cursor: loginLoading ? 'wait' : 'pointer',
                  boxShadow: loginLoading ? 'none' : '0 4px 16px rgba(28,74,52,0.35)',
                  transition: 'all 200ms ease',
                  opacity: loginLoading ? 0.7 : 1,
                }}
              >
                {loginLoading ? '⏳ Connexion en cours...' : 'Se Connecter →'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.78rem', color: '#888' }}>
              Pas encore inscrit ?{' '}
              <span
                onClick={() => setMode('selection')}
                style={{ color: '#1C4A34', fontWeight: 700, cursor: 'pointer' }}
              >
                Choisir mon secteur →
              </span>
            </p>
          </div>
        </main>
      )}

      {/* ─── Footer ─── */}
      <footer style={{
        textAlign: 'center', fontSize: '0.72rem',
        color: '#8A8A8A', paddingTop: 20,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        © 2026 KPSyDesk Business Suite — Solution Multi-Secteurs UEMOA
      </footer>
    </div>
  );
};
