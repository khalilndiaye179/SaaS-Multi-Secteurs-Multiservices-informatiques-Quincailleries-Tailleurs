import React, { useState } from 'react';
import { StorageService } from '../services/storage';

export enum SectorType {
  QUINCAILLERIE = 'QUINCAILLERIE',
  MULTISERVICES_IT = 'MULTISERVICES_IT',
  TAILLEUR = 'TAILLEUR',
}

interface SectorCard {
  type: SectorType;
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  color: string;
  gradient: string;
  border: string;
  features: string[];
}

const SECTORS: SectorCard[] = [
  {
    type: SectorType.QUINCAILLERIE,
    title: 'Quincaillerie & Matériaux',
    subtitle: 'Vente, stock, devis et factures conformes XOF',
    icon: '🔩',
    badge: 'Commerce & BTP',
    color: 'amber',
    gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
    border: 'border-amber-500/30 hover:border-amber-500',
    features: ['Gestion de stock multi-unités', 'Seuils d’alerte de rupture', 'Conversion devis → facture', 'Point de vente rapide'],
  },
  {
    type: SectorType.MULTISERVICES_IT,
    title: 'Multiservices Informatique',
    subtitle: 'Dépannage, pièces détachées et maintenance',
    icon: '💻',
    badge: 'Tech & Services',
    color: 'cyan',
    gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
    border: 'border-cyan-500/30 hover:border-cyan-500',
    features: ['Tickets de réparation SAV', 'Suivi du statut en temps réel', 'Facturation pièces + main d’œuvre', 'Historique matériel client'],
  },
  {
    type: SectorType.TAILLEUR,
    title: 'Atelier de Couture & Tailleur',
    subtitle: 'Rendez-vous, fiches de mesures et commandes',
    icon: '✂️',
    badge: 'Artisanat & Mode',
    color: 'emerald',
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    border: 'border-emerald-500/30 hover:border-emerald-500',
    features: ['Fiches de mesures 100% sur-mesure', 'Carnet d’essayages & rendez-vous', 'Suivi du cycle de confection', 'Gestion des acomptes & soldes'],
  },
];

export const SignupWizard: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedSector, setSelectedSector] = useState<SectorType | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    managerName: '',
    phone: '',
    email: '',
    country: 'SN',
    password: '',
  });
  const [otp, setOtp] = useState('');

  const handleSelectSector = (sector: SectorType) => {
    setSelectedSector(sector);
    setStep(2);
  };

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { ApiClient } = await import('../services/api-client');
      const payload = { ...formData, sectorType: selectedSector };
      await ApiClient.post('/api/auth/register/init', payload, true);
      
      setStep(3); // Passage à l'étape OTP
    } catch (err: any) {
      setError(err.message);
      alert(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { ApiClient } = await import('../services/api-client');
      // 1. Confirmation OTP
      await ApiClient.post('/api/auth/register/confirm', { email: formData.email, otp }, true);
      
      // 2. Connexion automatique
      const loginRes: any = await ApiClient.post('/api/auth/login', { identifier: formData.email, password: formData.password }, true);
      await StorageService.set('kpsy_token', loginRes.access_token);
      localStorage.setItem('kpsy_user', JSON.stringify(loginRes.user));
      
      alert(`Compte SaaS créé avec succès ! Bienvenue ${formData.companyName}.`);
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      alert(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
            ✨ KPSyDesk Suite - Door Waar — UEMOA

          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {step === 1 ? 'Choisissez votre secteur d’activité' : 'Créez le compte de votre entreprise'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {step === 1
              ? 'Votre espace métier sera automatiquement configuré selon votre secteur.'
              : 'Offre d’essai de 7 jours incluse (`TRIAL_7D`) — Sans carte bancaire.'}
          </p>
        </div>

        {/* Step 1: Sector Choice */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SECTORS.map((sector) => (
              <div
                key={sector.type}
                onClick={() => handleSelectSector(sector.type)}
                className={`relative group rounded-2xl p-6 bg-slate-900/60 backdrop-blur-xl border ${sector.border} transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl cursor-pointer flex flex-col justify-between overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-b ${sector.gradient} opacity-50 group-hover:opacity-100 transition-opacity`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">{sector.icon}</span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {sector.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{sector.title}</h3>
                  <p className="text-xs text-slate-400 mb-6">{sector.subtitle}</p>
                  <ul className="space-y-2 mb-6">
                    {sector.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center text-xs text-slate-300 force-gray-text gap-2">
                        <span className="text-indigo-400 font-bold">✓</span> {feat}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative z-10 pt-4 border-t border-slate-800">
                  <button className="w-full py-2.5 rounded-xl bg-slate-800 group-hover:bg-indigo-600 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2">
                    Sélectionner ce secteur →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Form */}
        {step === 2 && (
          <div className="max-w-xl mx-auto bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <button
              onClick={() => setStep(1)}
              className="text-xs text-slate-400 hover:text-indigo-400 mb-6 flex items-center gap-1 transition-colors"
            >
              ← Changer de secteur ({selectedSector})
            </button>

            <form onSubmit={handleInitSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nom de l’entreprise / Atelier</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Quincaillerie Al-Baraka / Couture Elegance"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nom du gérant</label>
                  <input
                    type="text"
                    required
                    placeholder="Khalil Ndiaye"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Pays (Zone UEMOA)</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="SN">🇸🇳 Sénégal (+221)</option>
                    <option value="CI">🇨🇮 Côte d'Ivoire (+225)</option>
                    <option value="ML">🇲🇱 Mali (+223)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    required
                    placeholder="77 000 00 00"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Adresse Email</label>
                  <input
                    type="email"
                    required
                    placeholder="gerant@entreprise.sn"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mot de passe</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 mt-4 rounded-xl font-semibold text-sm shadow-lg transition-all duration-200 ${
                  loading
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-indigo-500/25'
                }`}
              >
                {loading ? 'Traitement en cours...' : 'Continuer vers la vérification →'}
              </button>
            </form>
          </div>
        )}

        {/* Step 3: OTP Verification */}
        {step === 3 && (
          <div className="max-w-md mx-auto bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Vérification de l'Email</h2>
            <p className="text-sm text-slate-400 mb-6">
              Nous avons envoyé un code à 6 chiffres à <strong>{formData.email}</strong>. 
              Veuillez le saisir ci-dessous.
            </p>

            <form onSubmit={handleConfirmSubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className={`w-full py-3 rounded-xl font-semibold text-sm shadow-lg transition-all duration-200 ${
                  loading || otp.length < 6
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25'
                }`}
              >
                {loading ? 'Vérification...' : 'Valider et démarrer l’essai gratuit'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleInitSubmit}
              disabled={loading}
              className="mt-6 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Renvoyer le code
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
