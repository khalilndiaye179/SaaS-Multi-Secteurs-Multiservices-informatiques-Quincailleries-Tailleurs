import React, { useState, useEffect } from 'react';
import { SuperAdminApiService, ProviderConfigData } from '../../services/super-admin-api.service';
import { ForbiddenState } from './ForbiddenState';

interface Props {
  type: 'payment' | 'sms';
  themeColor?: string;
}

export const ProviderManagerView: React.FC<Props> = ({ type, themeColor = '#312E81' }) => {
  const [providers, setProviders] = useState<ProviderConfigData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProvider, setEditingProvider] = useState<ProviderConfigData | null>(null);
  const [configForm, setConfigForm] = useState({
    publicKey: '',
    secretKey: '',
    webhookSecret: '',
    senderId: 'KPSyDesk',
    environment: 'TEST' as 'TEST' | 'PRODUCTION',
  });

  useEffect(() => {
    fetchProviders();
  }, [type]);

  const fetchProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = type === 'payment'
        ? await SuperAdminApiService.getPaymentProviders()
        : await SuperAdminApiService.getSmsProviders();
      setProviders(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des fournisseurs.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (providerName: string, currentEnabled: boolean) => {
    try {
      if (type === 'payment') {
        await SuperAdminApiService.togglePaymentProvider(providerName, !currentEnabled);
      } else {
        await SuperAdminApiService.toggleSmsProvider(providerName, !currentEnabled);
      }
      fetchProviders();
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const handleTest = async (providerName: string) => {
    try {
      const res = type === 'payment'
        ? await SuperAdminApiService.testPaymentProvider(providerName)
        : await SuperAdminApiService.testSmsProvider(providerName);
      alert(res.message || 'Test de connexion exécuté avec succès !');
    } catch (err: any) {
      alert(`Échec du test : ${err.message}`);
    }
  };

  const handleOpenConfig = (p: ProviderConfigData) => {
    setEditingProvider(p);
    setConfigForm({
      publicKey: p.publicKey || '',
      secretKey: '',
      webhookSecret: '',
      senderId: p.senderId || 'KPSyDesk',
      environment: (p.environment as 'TEST' | 'PRODUCTION') || 'TEST',
    });
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;

    try {
      if (type === 'payment') {
        await SuperAdminApiService.upsertPaymentProviderConfig({
          provider: editingProvider.provider,
          displayName: editingProvider.displayName,
          environment: configForm.environment,
          publicKey: configForm.publicKey,
          secretKey: configForm.secretKey || undefined,
          webhookSecret: configForm.webhookSecret || undefined,
        });
      } else {
        await SuperAdminApiService.upsertSmsProviderConfig({
          provider: editingProvider.provider,
          displayName: editingProvider.displayName,
          environment: configForm.environment,
          senderId: configForm.senderId,
          secretKey: configForm.secretKey || undefined,
        });
      }

      alert('✅ Configuration des identifiants mise à jour avec succès ! (Secret chiffré en BDD via AES-256)');
      setEditingProvider(null);
      fetchProviders();
    } catch (err: any) {
      alert(`⚠️ Erreur de sauvegarde : ${err.message}`);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des passerelles...</div>;
  if (error?.includes('403')) return <ForbiddenState message="Seuls les rôles SUPER_ADMIN ont accès à la configuration des passerelles d'infrastructure." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0, fontFamily: "'Sora', sans-serif" }}>
          {type === 'payment' ? "💳 Moteur d'Intégration de Paiement" : '💬 Serveur SMS OTP & Notifications'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          {type === 'payment'
            ? 'Configuration des passerelles Wave, Orange Money, Bizao, Stripe et PayTech'
            : 'Passerelles SMS OTP Orange SMS, Twilio, Infobip et InTouch'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {providers.map((p) => (
          <div key={p.provider} style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0F172A' }}>{p.displayName || p.provider}</h3>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  background: p.enabled ? '#DCFCE7' : '#F1F5F9',
                  color: p.enabled ? '#166534' : '#64748B',
                }}
              >
                {p.enabled ? 'ACTIF' : 'INACTIF'}
              </span>
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              <div><strong>Environnement :</strong> <span style={{ color: p.environment === 'PRODUCTION' ? '#DC2626' : '#2563EB', fontWeight: 700 }}>{p.environment}</span></div>
              {type === 'payment' && <div><strong>Clé Publique :</strong> {p.publicKey ? `${p.publicKey.substring(0, 10)}...` : 'Non renseignée'}</div>}
              {type === 'sms' && <div><strong>Sender ID :</strong> {p.senderId || 'KPSyDesk'}</div>}
              <div><strong>Secret Chiffré (AES-256) :</strong> {p.hasSecret ? '🔒 Configuré (••••••••)' : '⚠️ Manquant'}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => handleOpenConfig(p)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: themeColor,
                  color: 'var(--text-inverse)',
                }}
              >
                ⚙️ Configurer les Clés d'API & Secrets
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleToggle(p.provider, p.enabled)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: p.enabled ? '#EF4444' : '#10B981',
                    color: 'var(--text-inverse)',
                  }}
                >
                  {p.enabled ? 'Désactiver' : 'Activer'}
                </button>
                <button
                  onClick={() => handleTest(p.provider)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: 'var(--bg-main)',
                    color: 'var(--text-muted)',
                  }}
                >
                  Tester Connexion
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CONFIGURATION CLÉS API & SECRETS */}
      {editingProvider && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', padding: 28, borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 4px 0', fontFamily: "'Sora', sans-serif", fontWeight: 800 }}>⚙️ Configurer Identifiants — {editingProvider.displayName}</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Les secrets d'API sont automatiquement chiffrés en base de données avec AES-256-GCM
            </p>

            <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Environnement</label>
                <select
                  value={configForm.environment}
                  onChange={(e) => setConfigForm({ ...configForm, environment: e.target.value as any })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                >
                  <option value="TEST">🧪 Mode TEST (Sandbox)</option>
                  <option value="PRODUCTION">🚀 Mode PRODUCTION</option>
                </select>
              </div>

              {type === 'payment' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Clé Publique (Public Key / Client ID)</label>
                  <input
                    type="text"
                    placeholder="pk_test_..."
                    value={configForm.publicKey}
                    onChange={(e) => setConfigForm({ ...configForm, publicKey: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                  />
                </div>
              )}

              {type === 'sms' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Sender ID (Expéditeur SMS)</label>
                  <input
                    type="text"
                    placeholder="KPSyDesk"
                    value={configForm.senderId}
                    onChange={(e) => setConfigForm({ ...configForm, senderId: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Clé Secrète (Secret Key / Auth Token)
                </label>
                <input
                  type="password"
                  placeholder={editingProvider.hasSecret ? '•••••••• (Laisser vide pour conserver)' : 'Saisir la nouvelle clé secrète'}
                  value={configForm.secretKey}
                  onChange={(e) => setConfigForm({ ...configForm, secretKey: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                />
              </div>

              {type === 'payment' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Secret de Signature Webhook (Optionnel)
                  </label>
                  <input
                    type="password"
                    placeholder="whsec_..."
                    value={configForm.webhookSecret}
                    onChange={(e) => setConfigForm({ ...configForm, webhookSecret: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" onClick={() => setEditingProvider(null)} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', fontWeight: 700, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: themeColor, color: 'var(--text-inverse)', fontWeight: 800, cursor: 'pointer' }}>
                  Enregistrer les Clés API
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
