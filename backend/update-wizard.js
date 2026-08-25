const fs = require('fs');

const path = "d:\\Formation creation site web pro avec l'IA\\@.SaaS Multi-Secteurs (Multiservices informatiques, Quincailleries & Tailleurs)\\frontend\\src\\components\\PremiumAuthWizard.tsx";
let code = fs.readFileSync(path, 'utf8');

// 1. Add states
code = code.replace(
  `  const [otpLoading, setOtpLoading] = useState(false);`,
  `  const [otpLoading, setOtpLoading] = useState(false);
  const [showTotpStep, setShowTotpStep] = useState(false);
  const [totpTempToken, setTotpTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpError, setTotpError] = useState<string | null>(null);
  const [totpLoading, setTotpLoading] = useState(false);`
);

// Remove totp-confirm from the initial state of mode if we want, but keeping it in the type is fine.
code = code.replace(
  `'otp-confirm' | 'totp-confirm'>('selection');`,
  `'otp-confirm'>('selection');`
);

// 2. Update requiresTotp block in handleLogin
code = code.replace(
  `      if (data.requiresTotp) {
        setFormData(prev => ({ ...prev, tempToken: data.tempToken }));
        setMode('totp-confirm');
        setLoginSuccess('Code 2FA requis.');
        return;
      }`,
  `      if (data.requiresTotp) {
        setTotpTempToken(data.tempToken);
        setShowTotpStep(true);
        return;
      }`
);

// 3. Replace handleVerifyTotp block
const verifyTotpOld = `  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    setLoginSuccess(null);
    
    try {
      const res = await fetch('/api/auth/login/verify-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempToken: formData.tempToken,
          code: formData.totpCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data?.message || 'Code 2FA incorrect.');
        return;
      }

      // Stocker le token JWT
      localStorage.setItem('kpsy_token', data.accessToken);
      localStorage.setItem('kpsy_user', JSON.stringify(data.user));
      localStorage.setItem('kpsy_tenant', JSON.stringify(data.tenant));

      const isSuperAdmin = data.user?.roles?.includes('SUPER_ADMIN');
      setLoginSuccess(\`Bienvenue \${data.user?.username} — Connexion réussie !\`);

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('kpsy:login', { detail: { isSuperAdmin } }));
      }, 800);

    } catch (err) {
      setLoginError('Erreur réseau.');
    } finally {
      setLoginLoading(false);
    }
  };`;

const verifyTotpNew = `  const handleVerifyTotp = async (e: React.FormEvent) => {
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
      localStorage.setItem('kpsy_token', data.accessToken);
      localStorage.setItem('kpsy_user', JSON.stringify(data.user));
      if (data.tenant) {
        localStorage.setItem('kpsy_tenant', JSON.stringify(data.tenant));
      }

      const isSuperAdmin = data.user?.roles?.includes('SUPER_ADMIN');
      setLoginSuccess(\`Bienvenue \${data.user?.username} — Connexion réussie !\`);

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('kpsy:login', { detail: { isSuperAdmin } }));
      }, 800);

    } catch (err) {
      setTotpError('Erreur réseau.');
    } finally {
      setTotpLoading(false);
    }
  };`;

code = code.replace(verifyTotpOld, verifyTotpNew);

// 4. Remove the <main> block for 'totp-confirm'
code = code.replace(/\{\/\* ─── ÉCRAN CONFIRMATION TOTP \(2FA\) ─── \*\/\}.*?\{\/\* ─── ÉCRAN CONNEXION B2B PREMIUM/s, `{/* ─── ÉCRAN CONNEXION B2B PREMIUM`);

// 5. In mode === 'login', add showTotpStep form replacement
const loginFormRegex = /(<form onSubmit=\{handleLogin\}.*?<\/form>)/s;
const loginFormMatch = code.match(loginFormRegex);
if (loginFormMatch) {
  const loginFormOld = loginFormMatch[1];
  const loginFormNew = `{showTotpStep ? (
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
                ${loginFormOld}
              )}`;
  code = code.replace(loginFormOld, loginFormNew);
} else {
  console.log("Could not find login form");
}

fs.writeFileSync(path, code, 'utf8');
console.log("Successfully updated PremiumAuthWizard.tsx");
