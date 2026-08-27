import React, { useState, useEffect } from 'react';
import { PremiumAuthWizard } from './components/PremiumAuthWizard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { TenantDashboard } from './components/TenantDashboard';
import { AcceptInvitationWizard } from './components/AcceptInvitationWizard';
import { ForceSecuritySetupModal } from './components/shared/ForceSecuritySetupModal';

type AppView = 'auth' | 'super-admin' | 'dashboard' | 'accept-invitation';

export function App() {
  const [view, setView] = useState<AppView>('auth');
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [showSecuritySetup, setShowSecuritySetup] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    // Vérifier s'il y a un token d'invitation dans l'URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token && window.location.pathname.includes('/accept-invitation')) {
      setInvitationToken(token);
      setView('accept-invitation');
      return;
    }

    const authToken = localStorage.getItem('kpsy_token');
    const userRaw = localStorage.getItem('kpsy_user');
    const tenantRaw = localStorage.getItem('kpsy_tenant');
    if (authToken && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        const tenant = tenantRaw ? JSON.parse(tenantRaw) : {};
        const isTeamAdmin = tenant?.code === 'SAAS-GLOBAL' || user?.roles?.includes('SUPER_ADMIN');
        
        // Décoder le JWT pour vérifier mustChangePassword si nécessaire ou l'utiliser depuis le payload
        const decodedJwt = JSON.parse(atob(authToken.split('.')[1]));
        if (decodedJwt.mustChangePassword) {
          setShowSecuritySetup(true);
          setCurrentUserId(user.id || decodedJwt.sub);
        }
        
        setView(isTeamAdmin ? 'super-admin' : 'dashboard');
      } catch {
        localStorage.clear();
      }
    }
    // Écouter l'événement de login émis par PremiumAuthWizard
    const handleLogin = (e: CustomEvent) => {
      const uRaw = localStorage.getItem('kpsy_user');
      const tRaw = localStorage.getItem('kpsy_token');
      const tenantRaw = localStorage.getItem('kpsy_tenant');
      if (uRaw && tRaw) {
        const u = JSON.parse(uRaw);
        const tenant = tenantRaw ? JSON.parse(tenantRaw) : {};
        const decoded = JSON.parse(atob(tRaw.split('.')[1]));
        if (decoded.mustChangePassword) {
          setShowSecuritySetup(true);
          setCurrentUserId(u.id || decoded.sub);
        }
        
        const isTeamAdmin = tenant?.code === 'SAAS-GLOBAL' || u?.roles?.includes('SUPER_ADMIN');
        console.log('[DEBUG ROUTING]', { tenantCode: tenant?.code, roles: u?.roles, isTeamAdmin });
        setView(isTeamAdmin ? 'super-admin' : 'dashboard');
      } else {
        setView(e.detail.isSuperAdmin ? 'super-admin' : 'dashboard');
      }
    };
    window.addEventListener('kpsy:login', handleLogin as EventListener);
    return () => window.removeEventListener('kpsy:login', handleLogin as EventListener);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('kpsy_token');
    localStorage.removeItem('kpsy_user');
    localStorage.removeItem('kpsy_tenant');
    setView('auth');
  };

  if (view === 'super-admin') return (
    <>
      <SuperAdminDashboard onLogout={handleLogout} />
      {showSecuritySetup && <ForceSecuritySetupModal userId={currentUserId} onComplete={() => setShowSecuritySetup(false)} />}
    </>
  );
  if (view === 'dashboard') return (
    <>
      <TenantDashboard onLogout={handleLogout} />
      {showSecuritySetup && <ForceSecuritySetupModal userId={currentUserId} onComplete={() => setShowSecuritySetup(false)} />}
    </>
  );
  
  if (view === 'accept-invitation' && invitationToken) {
    return (
      <AcceptInvitationWizard 
        token={invitationToken} 
        onSuccess={() => {
          // Nettoyer l'URL
          window.history.replaceState({}, document.title, '/');
          setView('auth');
        }} 
      />
    );
  }

  return <PremiumAuthWizard />;
}

export default App;

