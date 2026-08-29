import { StorageService } from '../../services/storage';
import React, { useState, useEffect } from 'react';
import { AuthApiService } from '../../services/auth-api.service';
import { ShieldAlert, KeyRound, Smartphone, CheckCircle2 } from 'lucide-react';

interface Props {
  onComplete: () => void;
  userId: string;
}

export const ForceSecuritySetupModal: React.FC<Props> = ({ onComplete, userId }) => {
  const [step, setStep] = useState(1);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Étape 1 : Changer le mot de passe
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit faire au moins 8 caractères.');
      return;
    }

    setLoading(true);
    try {
      await AuthApiService.changePassword({
        currentPassword,
        newPassword
      });
      // Mot de passe changé, on passe au TOTP
      await loadTotpSetup();
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du changement de mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  const loadTotpSetup = async () => {
    try {
      const res = await AuthApiService.setupTotp();
      setTotpSecret(res.secret);
      setQrCodeUrl(res.qrCodeDataUrl);
    } catch (err: any) {
      setError('Impossible d\'initialiser le 2FA.');
    }
  };

  // Étape 2 : Activer le TOTP
  const handleEnableTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!totpCode || totpCode.length < 6) {
      setError('Veuillez entrer un code valide à 6 chiffres.');
      return;
    }

    setLoading(true);
    try {
      const res = await AuthApiService.enableTotp({ code: totpCode });
      setBackupCodes(res.backupCodes);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Code invalide.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    // Déconnexion forcée pour re-générer un token propre avec les nouvelles infos (TOTP, mustChangePassword=false)
    await StorageService.remove('kpsy_token');
    localStorage.removeItem('kpsy_user');
    localStorage.removeItem('kpsy_tenant');
    window.location.href = '/';
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        
        {/* Header */}
        <div style={{ background: '#DC2626', padding: '24px 32px', color: 'white', display: 'flex', alignItems: 'center', gap: 16 }}>
          <ShieldAlert size={36} />
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Sécurisation Obligatoire</h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: 13, marginTop: 4 }}>Première connexion détectée</p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 32 }}>
          {error && (
            <div style={{ padding: 12, background: '#FEF2F2', color: '#991B1B', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 24, border: '1px solid #FCA5A5' }}>
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleChangePassword}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, color: '#0F172A' }}>
                <div style={{ width: 32, height: 32, borderRadius: 16, background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>1</div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Changement de mot de passe</h3>
              </div>
              <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>Pour des raisons de sécurité, vous devez modifier le mot de passe par défaut qui vous a été fourni.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Mot de passe actuel (celui de l'email)</label>
                  <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 15 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Nouveau mot de passe</label>
                  <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 15 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Confirmer le nouveau mot de passe</label>
                  <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 15 }} />
                </div>
              </div>
              
              <button type="submit" disabled={loading} style={{ width: '100%', padding: 14, background: '#0F172A', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, marginTop: 32, cursor: loading ? 'wait' : 'pointer' }}>
                {loading ? 'Vérification...' : 'Continuer vers le 2FA'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleEnableTotp}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, color: '#0F172A' }}>
                <div style={{ width: 32, height: 32, borderRadius: 16, background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>2</div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Activer l'Authentification 2FA</h3>
              </div>
              <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>Le 2FA (Double facteur) est obligatoire pour protéger l'accès à votre espace.</p>
              
              <div style={{ background: '#F8FAFC', padding: 24, borderRadius: 12, textAlign: 'center', marginBottom: 24 }}>
                <p style={{ fontSize: 13, color: '#475569', margin: '0 0 16px 0', fontWeight: 600 }}>1. Scannez ce QR Code avec Google Authenticator ou Authy</p>
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code" style={{ width: 180, height: 180, border: '4px solid white', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                ) : (
                  <div style={{ width: 180, height: 180, margin: '0 auto', background: '#E2E8F0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>Chargement...</div>
                )}
                <div style={{ marginTop: 16 }}>
                  <span style={{ fontSize: 12, color: '#64748B' }}>Code secret manuel :</span>
                  <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 2, color: '#0F172A', marginTop: 4 }}>{totpSecret}</div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>2. Entrez le code à 6 chiffres généré par l'application</label>
                <input type="text" required maxLength={6} value={totpCode} onChange={e => setTotpCode(e.target.value)} placeholder="000000" style={{ width: '100%', padding: '14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 24, letterSpacing: 8, textAlign: 'center', fontWeight: 800, color: '#0F172A' }} />
              </div>
              
              <button type="submit" disabled={loading || !qrCodeUrl} style={{ width: '100%', padding: 14, background: '#0F172A', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, marginTop: 32, cursor: loading ? 'wait' : 'pointer' }}>
                {loading ? 'Vérification...' : 'Activer le 2FA'}
              </button>
            </form>
          )}

          {step === 3 && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 32, color: '#16A34A' }}>
                <CheckCircle2 size={64} />
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Sécurité configurée !</h3>
              </div>
              
              <div style={{ background: '#FEFCE8', padding: 24, borderRadius: 12, border: '1px solid #FEF08A' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 15, color: '#854D0E', fontWeight: 700 }}>⚠️ Codes de secours (Backup Codes)</h4>
                <p style={{ fontSize: 13, color: '#A16207', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                  Copiez ces codes dans un endroit sûr. Ils vous permettront de vous connecter si vous perdez votre téléphone. Ils ne s'afficheront plus jamais.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {backupCodes.map(code => (
                    <div key={code} style={{ background: 'white', padding: '8px 12px', borderRadius: 6, fontSize: 14, fontFamily: 'monospace', fontWeight: 700, color: '#0F172A', textAlign: 'center', border: '1px solid #FEF08A' }}>
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handleFinish} style={{ width: '100%', padding: 14, background: '#0F172A', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, marginTop: 32, cursor: 'pointer' }}>
                Accéder à mon espace
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
