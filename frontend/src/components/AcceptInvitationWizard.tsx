import React, { useState } from 'react';
import { ShieldCheck, Mail, Phone, Lock, User, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { SuperAdminApiService } from '../services/super-admin-api.service';

interface AcceptInvitationWizardProps {
  token: string;
  onSuccess: () => void;
}

export function AcceptInvitationWizard({ token, onSuccess }: AcceptInvitationWizardProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setStatus('error');
      setErrorMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    if (formData.password.length < 8) {
      setStatus('error');
      setErrorMessage('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    try {
      setStatus('loading');
      await SuperAdminApiService.acceptInvitation({
        token,
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        password: formData.password,
      });
      setStatus('success');
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.response?.data?.message || 'Le lien est invalide ou a expiré.');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#7ED957] to-transparent opacity-50"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#7ED957] rounded-full blur-[100px] opacity-10"></div>
        
        <div className="flex justify-center mb-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-lg">
            <ShieldCheck className="text-[#7ED957]" size={32} />
          </div>
        </div>

        <div className="text-center mb-8 relative z-10">
          <h2 className="text-2xl font-bold text-white mb-2">Bienvenue dans l'équipe</h2>
          <p className="text-zinc-400 text-sm">Veuillez configurer votre profil Super Admin.</p>
        </div>

        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center py-8 relative z-10">
            <CheckCircle2 className="text-[#7ED957] w-16 h-16 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Profil activé !</h3>
            <p className="text-zinc-400 text-center mb-6">Vous allez être redirigé vers la page de connexion.</p>
            <div className="w-8 h-8 border-4 border-[#7ED957] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {status === 'error' && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Nom complet</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-[#7ED957] focus:ring-1 focus:ring-[#7ED957] transition-all"
                  placeholder="Jean Dupont"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Numéro de téléphone <span className="text-zinc-500">(Optionnel)</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-[#7ED957] focus:ring-1 focus:ring-[#7ED957] transition-all"
                  placeholder="+221 77 123 45 67"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-[#7ED957] focus:ring-1 focus:ring-[#7ED957] transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-[#7ED957] focus:ring-1 focus:ring-[#7ED957] transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-[#7ED957] hover:bg-[#6bc748] text-black font-semibold py-3 rounded-lg transition-colors flex justify-center items-center gap-2 mt-4 disabled:opacity-50"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Validation en cours...
                </>
              ) : (
                'Activer mon compte'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
