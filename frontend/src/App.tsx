import React, { useState, useEffect } from 'react';
import { PremiumAuthWizard } from './components/PremiumAuthWizard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { TenantDashboard } from './components/TenantDashboard';

type AppView = 'auth' | 'super-admin' | 'dashboard';

export function App() {
  const [view, setView] = useState<AppView>('auth');

  useEffect(() => {
    const token = localStorage.getItem('kpsy_token');
    const userRaw = localStorage.getItem('kpsy_user');
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');
        setView(isSuperAdmin ? 'super-admin' : 'dashboard');
      } catch {
        localStorage.clear();
      }
    }
    // Écouter l'événement de login émis par PremiumAuthWizard
    const handleLogin = (e: CustomEvent) => {
      setView(e.detail.isSuperAdmin ? 'super-admin' : 'dashboard');
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

  if (view === 'super-admin') return <SuperAdminDashboard onLogout={handleLogout} />;
  if (view === 'dashboard') return <TenantDashboard onLogout={handleLogout} />;
  return <PremiumAuthWizard />;
}

export default App;

