import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/api-client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  themeColor: string;
}

export const TotpSetupModal: React.FC<Props> = ({ isOpen, onClose, themeColor }) => {
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState<{ qrCodeDataUrl: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isSetupSuccess, setIsSetupSuccess] = useState(false);
  const [mode, setMode] = useState<'INITIAL' | 'SETUP' | 'SUCCESS'>('INITIAL');

  // Au montage, vérifier si l'utilisateur a déjà le 2FA
  const user = JSON.parse(localStorage.getItem('kpsy_user') || '{}');
  const isTotpEnabled = user.totpEnabled === true;

  useEffect(() => {
    if (isOpen) {
      setMode(isTotpEnabled ? 'INITIAL' : 'SETUP');
      if (!isTotpEnabled) {
        initSetup();
      }
    }
  }, [isOpen, isTotpEnabled]);

  const initSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiClient.get('/api/auth/2fa/setup', true);
      setSetupData(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'initialisation du 2FA.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.post('/api/auth/2fa/enable', { code }, true);
      setBackupCodes(res.backupCodes);
      setMode('SUCCESS');
      setIsSetupSuccess(true);
      // Mettre à jour le localStorage
      const updatedUser = { ...user, totpEnabled: true };
      localStorage.setItem('kpsy_user', JSON.stringify(updatedUser));
    } catch (err: any) {
      setError(err.message || 'Code 2FA incorrect.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm("Êtes-vous sûr de vouloir désactiver le 2FA ? Cela diminuera la sécurité de votre compte.")) return;
    
    setLoading(true);
    setError(null);
    try {
      await ApiClient.post('/api/auth/2fa/disable', { code }, true);
      // Mettre à jour le localStorage
      const updatedUser = { ...user, totpEnabled: false };
      localStorage.setItem('kpsy_user', JSON.stringify(updatedUser));
      alert('2FA désactivé avec succès.');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Code 2FA incorrect.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 12, padding: 32, width: '100%', maxWidth: 500, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, color: '#1A1A1A' }}>🔐 Sécurité : Double Authentification (2FA)</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#666' }}>&times;</button>
        </div>

        {error && (
          <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            ⚠️ {error}
          </div>
        )}

        {isTotpEnabled && mode === 'INITIAL' && (
          <div>
            <div style={{ padding: 16, background: '#F0FDF4', color: '#16A34A', borderRadius: 8, border: '1px solid #86EFAC', marginBottom: 20, fontWeight: 600 }}>
              ✅ La double authentification (2FA) est actuellement activée sur votre compte.
            </div>
            
            <h3 style={{ fontSize: 16, marginBottom: 10 }}>Désactiver le 2FA</h3>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>Pour désactiver le 2FA, veuillez saisir un code généré par votre application :</p>
            <form onSubmit={handleDisable} style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #CCC', fontSize: 16 }}
                required
              />
              <button type="submit" disabled={loading} style={{ background: '#DC2626', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
                {loading ? 'Désactivation...' : 'Désactiver'}
              </button>
            </form>
          </div>
        )}

        {(!isTotpEnabled || mode === 'SETUP') && mode !== 'SUCCESS' && (
          <div>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
              Sécurisez votre compte en ajoutant une étape supplémentaire lors de la connexion.
              Scannez le QR code avec Google Authenticator ou Microsoft Authenticator.
            </p>

            {loading && !setupData ? (
              <p>Génération du QR Code en cours...</p>
            ) : setupData ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                <img src={setupData.qrCodeDataUrl} alt="QR Code 2FA" style={{ width: 180, height: 180, border: '1px solid #EEE', borderRadius: 8, padding: 8, background: 'white' }} />
                <div style={{ marginTop: 16, fontSize: 13, color: '#666' }}>
                  Ou saisissez manuellement ce code : <br/>
                  <code style={{ background: '#F1F5F9', padding: '4px 8px', borderRadius: 4, color: '#0F172A', fontWeight: 'bold', display: 'inline-block', marginTop: 8 }}>{setupData.secret}</code>
                </div>
              </div>
            ) : null}

            <form onSubmit={handleEnable} style={{ borderTop: '1px solid #EEE', paddingTop: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Saisissez le code généré par l'application :</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{ flex: 1, padding: 12, borderRadius: 6, border: '1px solid #CCC', fontSize: 18, letterSpacing: '4px', textAlign: 'center' }}
                  required
                />
                <button type="submit" disabled={loading} style={{ background: themeColor, color: 'white', border: 'none', padding: '0 20px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
                  {loading ? 'Activation...' : 'Activer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {mode === 'SUCCESS' && (
          <div>
            <div style={{ padding: 16, background: '#F0FDF4', color: '#16A34A', borderRadius: 8, border: '1px solid #86EFAC', marginBottom: 20, fontWeight: 600, textAlign: 'center' }}>
              ✅ Félicitations ! Le 2FA est maintenant activé.
            </div>

            <div style={{ background: '#FFFBEB', padding: 16, border: '1px solid #FCD34D', borderRadius: 8 }}>
              <h3 style={{ fontSize: 16, color: '#B45309', margin: '0 0 10px 0' }}>⚠️ Codes de Secours (TRÈS IMPORTANT)</h3>
              <p style={{ fontSize: 13, color: '#92400E', marginBottom: 12, lineHeight: 1.5 }}>
                En cas de perte de votre téléphone, ces codes vous permettront de vous connecter. 
                <strong> Copiez-les et conservez-les dans un endroit sûr et secret.</strong> Ils ne seront plus jamais affichés.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {backupCodes.map((code, idx) => (
                  <div key={idx} style={{ background: 'white', border: '1px solid #FCD34D', padding: '8px 12px', borderRadius: 4, fontFamily: 'monospace', fontWeight: 'bold', fontSize: 14, textAlign: 'center', color: '#1A1A1A' }}>
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={onClose} style={{ width: '100%', background: themeColor, color: 'white', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', marginTop: 24 }}>
              J'ai sauvegardé mes codes (Fermer)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
