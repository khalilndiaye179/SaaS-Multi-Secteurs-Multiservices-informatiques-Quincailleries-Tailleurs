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
              KPSyDesk Business Suite Multi-Secteurs
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

      {/* Pied de page Crédits */}
      <div style={{ background: '#F8FAFC', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0', textAlign: 'center', fontSize: '0.82rem', color: '#64748B' }}>
        © 2026 <strong>KPSy Informatique</strong> — Développé avec passion par <strong>Ibrahima NDIAYE</strong> (Dakar, Sénégal). Tous droits réservés.
      </div>
    </div>
  );
};
