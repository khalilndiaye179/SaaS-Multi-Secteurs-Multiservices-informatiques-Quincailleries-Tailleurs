import React, { useState } from 'react';

export enum SectorType {
  QUINCAILLERIE = 'QUINCAILLERIE',
  MULTISERVICES_IT = 'MULTISERVICES_IT',
  TAILLEUR = 'TAILLEUR',
}

interface JwtPayload {
  sub: string;
  tenantId: string;
  sectorType: SectorType;
  roles: string[];
  tenantCode: string;
}

// Helper pour décoder le payload JWT côté frontend sans bibliothèque lourde
function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const AuthContainer: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [redirectedPath, setRedirectedPath] = useState<string | null>(null);

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('accessToken', token);
    const decoded = decodeJwt(token);

    if (decoded && decoded.sectorType) {
      let targetPath = '/app/quincaillerie/dashboard';
      if (decoded.sectorType === SectorType.MULTISERVICES_IT) {
        targetPath = '/app/multiservices-it/dashboard';
      } else if (decoded.sectorType === SectorType.TAILLEUR) {
        targetPath = '/app/tailleur/dashboard';
      }

      setRedirectedPath(targetPath);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulation de token émis par l'API NestJS
    const dummyToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      btoa(
        JSON.stringify({
          sub: 'usr_12345',
          tenantId: 'tnt_99999',
          sectorType: SectorType.QUINCAILLERIE,
          roles: ['ADMIN_TENANT'],
          tenantCode: 'QNC-0001',
        })
      ) +
      '.signature';

    handleLoginSuccess(dummyToken);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4">
      {redirectedPath ? (
        <div className="max-w-md w-full bg-[var(--bg-main)] border border-emerald-500/30 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="text-5xl">🚀</div>
          <h2 className="text-2xl font-bold text-emerald-400">Connexion Réussie !</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Redirection automatique basée sur la claim <code className="text-indigo-400">sectorType</code> du JWT :
          </p>
          <div className="py-3 px-4 rounded-xl bg-slate-950 border border-[var(--border-color)] text-indigo-300 font-mono text-sm">
            {redirectedPath}
          </div>
          <button
            onClick={() => setRedirectedPath(null)}
            className="text-xs text-[var(--text-muted)] underline hover:text-slate-300"
          >
            Se déconnecter / Tester un autre compte
          </button>
        </div>
      ) : (
        <div className="max-w-md w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-[var(--text-main)]">Espace Client SaaS UEMOA</h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">Connectez-vous pour accéder à votre espace métier</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Identifiant (Email ou Code Tenant)</label>
              <input
                type="text"
                required
                placeholder="QNC-0001-01 ou email@entreprise.sn"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Mot de passe</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-[var(--text-main)] font-semibold text-sm transition-colors shadow-lg shadow-indigo-600/20"
            >
              Se Connecter →
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
