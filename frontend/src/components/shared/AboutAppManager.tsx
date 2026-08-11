import React from 'react';

interface Props {
  themeColor: string;
}

export const AboutAppManager: React.FC<Props> = ({ themeColor }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 960, margin: '0 auto' }}>
      {/* Hero Header */}
      <div style={{ background: `linear-gradient(135deg, ${themeColor} 0%, #0F172A 100%)`, color: 'white', padding: 36, borderRadius: 16, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
            🚀
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, fontFamily: "'Sora', sans-serif" }}>
              KPSyDesk Suite - Door Waar Multi-Secteurs
            </h1>

            <p style={{ margin: 0, opacity: 0.85, fontSize: '0.9rem' }}>
              Plateforme cloud de gestion ERP & CRM sur-mesure pour Multiservices IT, Quincailleries & Ateliers de Couture
            </p>
          </div>
        </div>
      </div>

      {/* Grid Informations Éditeur & Contact */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Carte Développeur & Éditeur */}
        <div style={{ background: 'white', padding: 24, borderRadius: 14, border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
            👨‍💻 Éditeur & Conception Technologique
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.88rem', color: '#374151' }}>
            <div>
              <strong style={{ color: '#6B7280', fontSize: '0.75rem', display: 'block' }}>SOCIÉTÉ ÉDITRICE</strong>
              <span style={{ fontWeight: 800, color: themeColor, fontSize: '1.05rem' }}>KPSy Informatique</span>
            </div>

            <div>
              <strong style={{ color: '#6B7280', fontSize: '0.75rem', display: 'block' }}>CONCEPTEUR & DÉVELOPPEUR PRINCIPAL</strong>
              <span style={{ fontWeight: 800, color: '#111827' }}>Ibrahima NDIAYE</span>
            </div>

            <div>
              <strong style={{ color: '#6B7280', fontSize: '0.75rem', display: 'block' }}>EMAIL CONTACT DIRECT</strong>
              <a href="mailto:neguinho.ndiaye@gmail.com" style={{ fontWeight: 700, color: themeColor, textDecoration: 'none' }}>
                neguinho.ndiaye@gmail.com
              </a>
            </div>

            <div>
              <strong style={{ color: '#6B7280', fontSize: '0.75rem', display: 'block' }}>TÉLÉPHONE / WHATSAPP SUPPORT</strong>
              <a href="tel:+221778034756" style={{ fontWeight: 800, color: '#111827', textDecoration: 'none' }}>
                +221 77 803 47 56
              </a>
            </div>
          </div>
        </div>

        {/* Spécifications Techniques & Version */}
        <div style={{ background: 'white', padding: 24, borderRadius: 14, border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
            🛠️ Architecture & Déploiement
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem', color: '#374151' }}>
            <div>
              <strong style={{ color: '#6B7280', fontSize: '0.75rem', display: 'block' }}>VERSION APPLICATIVE</strong>
              <span style={{ padding: '3px 8px', borderRadius: 6, background: '#D1FAE5', color: '#065F46', fontWeight: 800, fontSize: '0.8rem' }}>
                v2.4.0-PRO (Conforme UEMOA 2026)
              </span>
            </div>

            <div>
              <strong style={{ color: '#6B7280', fontSize: '0.75rem', display: 'block' }}>TECHNOLOGIES CORE</strong>
              <span>NestJS 10, React 18, Vite 5, Prisma ORM, PostgreSQL, Docker & Nginx</span>
            </div>

            <div>
              <strong style={{ color: '#6B7280', fontSize: '0.75rem', display: 'block' }}>CONFORMITÉ FISCALE</strong>
              <span>TVA Optionnelle 18% UEMOA, NINEA / RCCM / IFU sur documents officiels</span>
            </div>

            <div>
              <strong style={{ color: '#6B7280', fontSize: '0.75rem', display: 'block' }}>SÉCURITÉ ET DONNÉES</strong>
              <span>Isolation Multi-Tenant complète, Hashage Bcrypt & Authentification JWT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Support-Assistance & Clauses de Confidentialité */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Support Client & Assistance Technique */}
        <div style={{ background: 'white', padding: 24, borderRadius: 14, border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
            📞 Support Technique & Assistance Client
          </h3>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#4B5563', lineHeight: 1.5 }}>
            Une équipe dédiée vous accompagne au quotidien pour garantir la continuité de service et répondre à toutes vos questions d'utilisation.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem', marginTop: 4 }}>
            <div style={{ padding: '10px 12px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #F3F4F6' }}>
              <strong style={{ color: '#111827', display: 'block', fontSize: '0.78rem' }}>🟢 ASSISTANCE TÉLÉPHONIQUE & WHATSAPP</strong>
              <a href="https://wa.me/221778034756" target="_blank" rel="noreferrer" style={{ fontWeight: 800, color: themeColor, textDecoration: 'none' }}>
                +221 77 803 47 56 (7j/7 - 08h00 à 20h00 GMT)
              </a>
            </div>

            <div style={{ padding: '10px 12px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #F3F4F6' }}>
              <strong style={{ color: '#111827', display: 'block', fontSize: '0.78rem' }}>✉️ SUPPORT TICKETING & EMAIL</strong>
              <a href="mailto:neguinho.ndiaye@gmail.com" style={{ fontWeight: 700, color: '#3B82F6', textDecoration: 'none' }}>
                neguinho.ndiaye@gmail.com
              </a>
            </div>

            <div style={{ padding: '10px 12px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #F3F4F6' }}>
              <strong style={{ color: '#111827', display: 'block', fontSize: '0.78rem' }}>📍 BUREAU & ADRESSE ÉDITEUR</strong>
              <span style={{ color: '#4B5563', fontSize: '0.82rem' }}>
                KPSy Informatique — Dakar, Sénégal (Zone UEMOA)
              </span>
            </div>
          </div>
        </div>

        {/* Clauses de Confidentialité & Protection des Données */}
        <div style={{ background: 'white', padding: 24, borderRadius: 14, border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
            🔒 Clauses de Confidentialité & Protection des Données
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8rem', color: '#4B5563', lineHeight: 1.55 }}>
            <div style={{ padding: '8px 10px', background: '#ECFDF5', borderLeft: '4px solid #10B981', borderRadius: 4 }}>
              <strong style={{ color: '#065F46', display: 'block' }}>1. Strict Isolement Multi-Tenant (RLS)</strong>
              Chaque entreprise (Tenant) dispose d'un espace strictement étanche. Vos données de ventes, clients et financières ne sont jamais partagées ni accessibles par d'autres utilisateurs.
            </div>

            <div style={{ padding: '8px 10px', background: '#F0F9FF', borderLeft: '4px solid #0284C7', borderRadius: 4 }}>
              <strong style={{ color: '#075985', display: 'block' }}>2. Cryptage & Sécurité des Mots de Passe</strong>
              Les mots de passe sont hachés via l'algorithme `bcrypt`. Les communications sont sécurisées par SSL/TLS (HTTPS).
            </div>

            <div style={{ padding: '8px 10px', background: '#FFFBEB', borderLeft: '4px solid #F59E0B', borderRadius: 4 }}>
              <strong style={{ color: '#92400E', display: 'block' }}>3. Propriété Exclusive des Données</strong>
              Toutes les données saisies demeurent la propriété exclusive de l'entreprise cliente. Des exports de sauvegarde au format officiel peuvent être effectués à tout moment.
            </div>
          </div>
        </div>
      </div>

      {/* Pied de page Crédits */}
      <div style={{ background: '#F8FAFC', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0', textAlign: 'center', fontSize: '0.82rem', color: '#64748B' }}>
        © 2026 <strong>KPSy Informatique</strong> — Développé avec passion par <strong>Ibrahima NDIAYE</strong> (Dakar, Sénégal). Tous droits réservés.
      </div>
    </div>
  );
};

