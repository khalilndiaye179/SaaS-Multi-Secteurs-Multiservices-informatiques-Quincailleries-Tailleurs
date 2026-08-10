import React, { useState } from 'react';

interface Props {
  sector: string;
  themeColor: string;
}

export const UserGuideManager: React.FC<Props> = ({ sector, themeColor }) => {
  const getTabsForSector = () => {
    const commonTabs = [
      { id: 'billing', label: '📄 Factures, Devis & TVA', icon: '📄' },
      { id: 'employees', label: '👥 Gestion des Collaborateurs', icon: '👥' },
      { id: 'logo', label: '🖼️ Logo & Impression PDF', icon: '🖼️' },
    ];

    if (sector === 'MULTISERVICES_IT') {
      return [
        { id: 'sav', label: '🛠️ Tickets SAV & Atelier IT', icon: '🛠️' },
        { id: 'sla', label: '⏱️ SLA & Délais de Service', icon: '⏱️' },
        ...commonTabs,
      ];
    } else if (sector === 'QUINCAILLERIE') {
      return [
        { id: 'quincaillerie', label: '📦 Inventaire Stock & Caisse Quincaillerie', icon: '🛒' },
        { id: 'purchases', label: '🚚 Achats Fournisseurs & Réapprovisionnement', icon: '🚚' },
        { id: 'reports', label: '📈 Rapports & Marges Bénéficiaires', icon: '📈' },
        ...commonTabs,
      ];
    } else if (sector === 'TAILLEUR') {
      return [
        { id: 'tailleur', label: '✂️ Fiches Mesures & Commandes Confection', icon: '👗' },
        ...commonTabs,
      ];
    }
    return commonTabs;
  };

  const tabs = getTabsForSector();
  const [activeSection, setActiveSection] = useState<string>(tabs[0]?.id || 'billing');


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1080, margin: '0 auto' }}>
      {/* Header Guide */}
      <div>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.25rem', margin: 0, color: '#111827' }}>
          📘 Guide d'Utilisation Officiel — {sector === 'MULTISERVICES_IT' ? 'Multiservices IT' : sector === 'QUINCAILLERIE' ? 'Quincaillerie' : 'Atelier Couture'}
        </h2>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#6B7280' }}>
          Manuel interactif de prise en main des modules KPSyDesk réservés à votre secteur d'activité
        </p>
      </div>

      {/* Navigation par thèmes spécifiques */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #E5E7EB', paddingBottom: 8, overflowX: 'auto' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              background: activeSection === tab.id ? themeColor : '#F1F5F9',
              color: activeSection === tab.id ? 'white' : '#475569',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>


      {/* Contenu dynamique par section */}
      <div style={{ background: 'white', padding: 28, borderRadius: 14, border: '1px solid #E5E7EB', minHeight: 380 }}>
        {activeSection === 'billing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, color: themeColor, fontSize: '1.1rem', fontWeight: 800 }}>
              📄 Module Devis & Factures (Gestion Financière)
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.5 }}>
              Le module Devis & Factures vous permet de créer, d'imprimer en PDF et d'annuler vos documents commerciaux en quelques clics.
            </p>
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 10, borderLeft: `4px solid ${themeColor}`, fontSize: '0.85rem' }}>
              <strong>Points clés :</strong>
              <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                <li><strong>Conversion 1-Clic :</strong> Un devis accepté peut être instantanément converti en facture.</li>
                <li><strong>TVA Optionnelle UEMOA :</strong> Le taux de TVA (18%) peut être activé ou désactivé dans les Paramètres.</li>
                <li><strong>Annulation sécurisée :</strong> Seul un utilisateur Admin peut annuler une facture ou un devis.</li>
              </ul>
            </div>
          </div>
        )}

        {activeSection === 'sav' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, color: themeColor, fontSize: '1.1rem', fontWeight: 800 }}>
              🛠️ Module Tickets SAV & Atelier IT
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.5 }}>
              Suivez le parcours complet des équipements confiés par vos clients, de la réception à la restitution.
            </p>
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 10, borderLeft: `4px solid ${themeColor}`, fontSize: '0.85rem' }}>
              <strong>Étapes du Workflow SAV :</strong>
              <ol style={{ margin: '6px 0 0 18px', padding: 0 }}>
                <li><strong>1. Reçu à l'Atelier :</strong> Génération automatique du numéro de fiche de dépôt (`TCK-2026-XXXX`).</li>
                <li><strong>2. Diagnostic & Devis :</strong> Estimation du coût de la réparation.</li>
                <li><strong>3. Réparation en cours / Prêt :</strong> Notification d'avancement.</li>
                <li><strong>4. Statuts Spéciaux :</strong> Marquer un ticket comme <em>Dépannage Impossible</em> ou <em>Client Désisté (+ Motif)</em>.</li>
              </ol>
            </div>
          </div>
        )}

        {activeSection === 'sla' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, color: themeColor, fontSize: '1.1rem', fontWeight: 800 }}>
              ⏱️ Module SLA & Engagements de Service IT
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.5 }}>
              Définissez vos niveaux d'engagement de délai (Critique, Haute, Standard, Basse) pour garantir la qualité de service à vos clients sous contrat.
            </p>
          </div>
        )}

        {activeSection === 'employees' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, color: themeColor, fontSize: '1.1rem', fontWeight: 800 }}>
              👥 Module Collaborateurs & Permissions par Cases à Cocher
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.5 }}>
              Créez des accès individualisés pour chaque membre de votre équipe (Techniciens, Caissiers, Vendeurs) en cochant simplement les modules qu'ils ont le droit d'utiliser.
            </p>
          </div>
        )}

        {activeSection === 'logo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, color: themeColor, fontSize: '1.1rem', fontWeight: 800 }}>
              🖼️ Personnalisation du Logo & Impression PDF
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.5 }}>
              Importez votre logo au format PNG, JPEG, WEBP ou SVG. L'application le convertit automatiquement et l'affiche en miniature dans l'angle supérieur gauche de tous vos documents imprimés.
            </p>
          </div>
        )}

        {activeSection === 'quincaillerie' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, color: themeColor, fontSize: '1.1rem', fontWeight: 800 }}>
              📦 Module Inventaire, Stock & Ventes Comptoir (Caisse)
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.5 }}>
              Ce module centralise la gestion de vos matériaux (Ciment, Fer, Peinture, Plomberie) et vos encaissements rapides en caisse.
            </p>
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 10, borderLeft: `4px solid ${themeColor}`, fontSize: '0.85rem' }}>
              <strong>Fonctionnalités Clés Quincaillerie :</strong>
              <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                <li><strong>Gestion par SKU & Unité :</strong> Suivez vos articles par référence unique, sacs, barres ou unités.</li>
                <li><strong>Alertes de Stock Bas :</strong> Badges rouges automatiques dès qu'un produit franchit le seuil critique.</li>
                <li><strong>Ventes Comptoir Directes :</strong> Déduction automatique des stocks lors de la validation d'une vente en caisse.</li>
              </ul>
            </div>
          </div>
        )}

        {activeSection === 'purchases' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, color: themeColor, fontSize: '1.1rem', fontWeight: 800 }}>
              🚚 Module Achats Fournisseurs & Réapprovisionnement
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.5 }}>
              Enregistrez vos bons de commande et factures d'achat fournisseurs pour recalculer automatiquement votre coût d'achat moyen et réapprovisionner votre dépôt.
            </p>
          </div>
        )}

        {activeSection === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, color: themeColor, fontSize: '1.1rem', fontWeight: 800 }}>
              📈 Module Rapports d'Activité & Marges Bénéficiaires
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.5 }}>
              Visualisez instantanément votre chiffre d'affaires, vos coûts d'achat et vos marges nettes dégagées par famille de matériaux.
            </p>
          </div>
        )}

        {activeSection === 'tailleur' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ margin: 0, color: themeColor, fontSize: '1.15rem', fontWeight: 800 }}>
              ✂️ Manuel Officiel de l'Atelier de Couture & Confection (Secteur Tailleur)
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.6, margin: 0 }}>
              Ce guide détaille l'utilisation intégrale des 4 modules spécialisés pour les ateliers de couture, maîtres tailleurs et maisons de haute couture zone UEMOA.
            </p>

            {/* 1. Fiches de Mesures Clients & Sous-Fiches Famille */}
            <div style={{ background: '#F8FAFC', padding: 18, borderRadius: 12, borderLeft: `4px solid ${themeColor}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h4 style={{ margin: 0, color: '#1E293B', fontSize: '0.98rem', fontWeight: 800 }}>
                1. 📏 Fiches de Mesures Clients & Sous-Fiches Membres de la Famille
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                Enregistrez le profil complet de chaque client ainsi que les mensurations des membres de sa famille sous une seule fiche centralisée.
              </p>
              <ul style={{ margin: '4px 0 0 18px', padding: 0, fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                <li><strong>Sous-fiches Clients Famille :</strong> Ajoutez autant de sous-fiches que nécessaire pour les enfants ou proches (ex: <em>Fils (Moussa)</em>, <em>Épouse (Awa)</em>, <em>Fille (Fatou)</em>) rattachées au même numéro du responsable.</li>
                <li><strong>Mensurations Complètes (en cm) :</strong> Saisie précise incluant <em>Cou</em>, <em>Poitrine</em>, <em>Taille</em>, <em>Hanches</em>, <em>Longueur Boubou/Robe</em>, <em>Carrure / Épaules</em>, <em>Longueur Manche</em>, <em>Tour de Bras</em>, <em>Tour de Poignet</em>, <em>Tour de Cuisses</em> & <em>Tour de Fesses</em>.</li>
                <li><strong>Boutons d'Actions :</strong> Boutons de ✏️ <em>Modification</em>, 🗑️ <em>Suppression</em> (réservée à l'Administrateur du Tenant) et 👁️ <em>Visionnage / Impression PDF Bon de Mesures</em>.</li>
              </ul>
            </div>

            {/* 2. Commandes et Confection */}
            <div style={{ background: '#F8FAFC', padding: 18, borderRadius: 12, borderLeft: `4px solid ${themeColor}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h4 style={{ margin: 0, color: '#1E293B', fontSize: '0.98rem', fontWeight: 800 }}>
                2. 🧵 Commandes de Confection, Suivi Financier & Annulations
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                Gestion du cycle de fabrication des tenues, contrôle des avances perçues et calcul automatique du solde restant dû en XOF.
              </p>
              <ul style={{ margin: '4px 0 0 18px', padding: 0, fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                <li><strong>Changement de Statut Atelier :</strong> Suivez les 6 étapes d'avancement (<em>Commandé ➔ Coupe en cours ➔ Couture en cours ➔ Rdv Essayage ➔ Prêt à livrer ➔ Livré</em>).</li>
                <li><strong>✏️ Modification & 🚫 Annulation (+ Motif) :</strong> Modifiez les données financières d'une commande. En cas de désistement ou de rupture de tissu, le bouton <em>Annuler</em> requiert la saisie d'un motif clair d'annulation.</li>
                <li><strong>🖨️ PDF Bon de Commande Couture :</strong> Éditez un document imprimable propre avec le logo et les coordonnées du tenant pour votre client.</li>
                <li><strong>🗑️ Suppression Sécurisée :</strong> Bouton de suppression protégé réservé uniquement au Gérant Administrateur du Tenant.</li>
              </ul>
            </div>

            {/* 3. Agenda des Essayages & Livraisons */}
            <div style={{ background: '#F8FAFC', padding: 18, borderRadius: 12, borderLeft: `4px solid ${themeColor}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h4 style={{ margin: 0, color: '#1E293B', fontSize: '0.98rem', fontWeight: 800 }}>
                3. 📅 Agenda des Essayages & Livraisons (Planning Atelier)
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                Synchronisation automatique de toutes les tenues enregistrées ou passant au statut <em>"Rdv Essayage"</em>.
              </p>
              <ul style={{ margin: '4px 0 0 18px', padding: 0, fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                <li><strong>📅 Reprogrammation Rapide :</strong> Modifiez en 1-clic la date du prochain rendez-vous d'essayage ou la date de livraison promise.</li>
                <li><strong>👁️ / 🖨️ PDF Fiche Essayage :</strong> Impression de la fiche de suivi d'essayage à remettre à l'artisan tailleur.</li>
              </ul>
            </div>

            {/* 4. Catalogue des Modèles & Tarifs */}
            <div style={{ background: '#F8FAFC', padding: 18, borderRadius: 12, borderLeft: `4px solid ${themeColor}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h4 style={{ margin: 0, color: '#1E293B', fontSize: '0.98rem', fontWeight: 800 }}>
                4. 👗 Catalogue des Modèles & Tarifs Confection
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                Base de données des modèles confectionnés par l'atelier (Grands Boubous Bazin Getzner, Tailles Basses, Costumes 2/3 Pièces, Robes de Mariée).
              </p>
              <ul style={{ margin: '4px 0 0 18px', padding: 0, fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                <li><strong>Tarifs & Délais indicatifs :</strong> Fixez le prix moyen en XOF et le nombre de jours nécessaires pour la réalisation.</li>
                <li><strong>🧵 Tissus Recommandés :</strong> Saisissez les recommandations de matières (Bazin Riche, Soie, Cashmere) pour guider le client.</li>
                <li><strong>Actions :</strong> Boutons d'ajout <em>+ Nouveau Modèle</em>, 👁️ <em>Fiche Technique</em>, ✏️ <em>Modifier</em> et 🗑️ <em>Supprimer (Admin)</em>.</li>
              </ul>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};
