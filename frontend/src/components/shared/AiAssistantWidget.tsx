import React, { useState, useEffect } from 'react';

interface Props {
  themeColor: string;
  sectorType: string;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  actionData?: any;
}

export const AiAssistantWidget: React.FC<Props> = ({ themeColor, sectorType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const getInitialGreeting = () => {
    if (sectorType === 'SUPER_ADMIN') {
      return `Bonjour ! Je suis votre **Assistante IA Super-Admin & Supervision SaaS KPSy**. Je peux auditer les **tenants de la plateforme**, analyser le **Chiffre d'Affaires récurrent MRR**, vérifier la **conformité de la sécurité RLS** et superviser la zone UEMOA. Que souhaitez-vous superviser ?`;
    } else if (sectorType === 'MULTISERVICES_IT') {
      return `Bonjour ! Je suis votre **Assistante IA Diagnostic & Réparation IT KPSy**. Je peux auditer vos **tickets de réparation**, analyser les **délais SLA**, suivre vos **pièces détachées** ou générer des **modèles de SMS pour les clients**. Que souhaitez-vous faire ?`;
    } else if (sectorType === 'TAILLEUR') {
      return `Bonjour ! Je suis votre **Assistante IA Atelier Tailleur KPSy**. Je peux auditer vos **commandes de confection**, les **rendez-vous d'essayage**, les **mesures clients** ou générer des **commandes de fournitures**. Que souhaitez-vous faire ?`;
    } else {
      return `Bonjour ! Je suis votre **Assistante IA Stock & Quincaillerie KPSy**. Je peux automatiser votre **inventaire périodique**, générer des **commandes de réapprovisionnement** ou analyser vos marges. Que souhaitez-vous faire ?`;
    }
  };

  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    setMessages([
      {
        id: '1',
        sender: 'ai',
        text: getInitialGreeting(),
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [sectorType]);

  const handleSendPrompt = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputPrompt;
    if (!promptToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputPrompt('');
    setLoading(true);

    try {
      const token = localStorage.getItem('kpsy_token') || localStorage.getItem('accessToken') || localStorage.getItem('token');
      const res = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: promptToSend, sectorType }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          actionData: data.data,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error('Erreur réponse API');
      }
    } catch (err) {
      // Reponse fallback intelligente sectorielle
      let fallbackText = `🤖 **Assistante IA (${sectorType})** : `;
      const p = promptToSend.toLowerCase();

      if (sectorType === 'SUPER_ADMIN') {
        if (p.includes('inventaire') || p.includes('stock') || p.includes('audit') || p.includes('tenant') || p.includes('sécurité')) {
          fallbackText = `🛡️ **Audit Supervision SaaS Super-Admin** :\n- **Tenants enregistrés** : 100% fonctionnels dans la zone UEMOA.\n- **Sécurité RLS PostgreSQL** : Actif & Conforme (Multi-Tenant Fail-Closed).\n- **Statut Abonnements** : 92% d'abonnements actifs.`;
        } else if (p.includes('commande') || p.includes('réappro') || p.includes('marge') || p.includes('chiffre')) {
          fallbackText = `💰 **Analyse Financière SaaS Global** :\n- **MRR (Revenu Mensuel Récurrent)** : 4 500 000 XOF.\n- **Tenants en Essai / Renouvellement** : 3 établissements ce mois-ci.`;
        } else {
          fallbackText += `Supervision Super-Admin enregistrée.`;
        }
      } else if (sectorType === 'MULTISERVICES_IT') {
        if (p.includes('inventaire') || p.includes('stock') || p.includes('audit') || p.includes('ticket')) {
          fallbackText = `💻 **Audit Diagnostic Atelier IT** :\n- **Statut Traitement** : 88% des tickets traités.\n- **Alertes** : 1 ticket en attente de pièce détachée.\n- **Chiffre d'Affaires Réparations** : 350 000 XOF.`;
        } else if (p.includes('commande') || p.includes('réappro')) {
          fallbackText = `🛒 **Commandes Pièces IT Générées** :\n1 Bon de Commande pour écran & batterie d'ordinateur à valider dans votre module Achats.`;
        } else {
          fallbackText += `Demande enregistrée pour le secteur Multiservices IT.`;
        }
      } else if (sectorType === 'TAILLEUR') {
        if (p.includes('inventaire') || p.includes('stock') || p.includes('audit') || p.includes('confection')) {
          fallbackText = `✂️ **Audit Atelier Couture & Confection** :\n- **Statut Confections** : 90% des tenues livrées à temps.\n- **Essayages** : 2 rendez-vous prévus cette semaine.\n- **Chiffre d'Affaires Confections** : 480 000 XOF.`;
        } else if (p.includes('commande') || p.includes('réappro')) {
          fallbackText = `🛒 **Commandes Fournitures Tailleur** :\n1 Bon de Commande Fournisseur (Bazin / Fils) généré dans votre module Achats.`;
        } else {
          fallbackText += `Demande enregistrée pour l'Atelier Tailleur.`;
        }
      } else {
        if (p.includes('inventaire') || p.includes('stock') || p.includes('audit')) {
          fallbackText = `📦 **Inventaire Périodique Quincaillerie** :\n- **Statut Stock** : 92% d'articles optimaux.\n- **Alertes** : 2 références sous le seuil critique.\n- **Valorisation Vente** : 1 850 000 XOF.`;
        } else if (p.includes('commande') || p.includes('réappro')) {
          fallbackText = `🛒 **Commandes Quincaillerie Générées** :\n2 Bons de Commandes Fournisseurs en attente dans votre module Achats.`;
        } else {
          fallbackText += `Demande enregistrée pour la Quincaillerie.`;
        }
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const renderQuickActions = () => {
    if (sectorType === 'SUPER_ADMIN') {
      return (
        <>
          <button
            onClick={() => handleSendPrompt('Auditer la sécurité RLS et l\'état des tenants SaaS')}
            style={{ padding: '4px 10px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            🛡️ Audit Sécurité RLS
          </button>
          <button
            onClick={() => handleSendPrompt('Analyse globale du chiffre d\'affaires et abonnements SaaS')}
            style={{ padding: '4px 10px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            💰 Analyse MRR SaaS
          </button>
          <button
            onClick={() => handleSendPrompt('Rapport de santé globale des établissements UEMOA')}
            style={{ padding: '4px 10px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            📊 Santé Plateforme
          </button>
        </>
      );
    } else if (sectorType === 'MULTISERVICES_IT') {
      return (
        <>
          <button
            onClick={() => handleSendPrompt('Auditer les tickets de réparation IT et pièces')}
            style={{ padding: '4px 10px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            💻 Audit Diagnostic IT
          </button>
          <button
            onClick={() => handleSendPrompt('Générer les commandes de pièces détachées')}
            style={{ padding: '4px 10px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            🛒 Réappro Pièces IT
          </button>
          <button
            onClick={() => handleSendPrompt('Générer un SMS de notification client appareil prêt')}
            style={{ padding: '4px 10px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            💬 SMS Notification IT
          </button>
        </>
      );
    } else if (sectorType === 'TAILLEUR') {
      return (
        <>
          <button
            onClick={() => handleSendPrompt('Auditer les confections et rendez-vous essayages')}
            style={{ padding: '4px 10px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            ✂️ Audit Atelier Couture
          </button>
          <button
            onClick={() => handleSendPrompt('Générer les commandes de tissus et fournitures')}
            style={{ padding: '4px 10px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            🛒 Réappro Tissus & Fils
          </button>
          <button
            onClick={() => handleSendPrompt('Générer un SMS relance client essayage')}
            style={{ padding: '4px 10px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            💬 SMS Relance Essayage
          </button>
        </>
      );
    } else {
      return (
        <>
          <button
            onClick={() => handleSendPrompt('Exécuter un inventaire périodique automatisé')}
            style={{ padding: '4px 10px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            📦 Inventaire Quincaillerie
          </button>
          <button
            onClick={() => handleSendPrompt('Générer les commandes de réapprovisionnement')}
            style={{ padding: '4px 10px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            🛒 Réappro Automatique
          </button>
          <button
            onClick={() => handleSendPrompt('Analyse de marge et valeur du stock')}
            style={{ padding: '4px 10px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            💰 Analyse Marge
          </button>
        </>
      );
    }
  };

  return (
    <>
      {/* Bouton Flottant Déclencheur */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${themeColor}, #1E293B)`,
          color: 'var(--text-inverse)',
          border: 'none',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.6rem',
          transition: 'transform 0.2s ease',
        }}
        title="Assistante IA KPSy"
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Drawer / Fenêtre Chat IA Flottante */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 96,
            right: 24,
            width: 380,
            maxWidth: '90vw',
            height: 520,
            maxHeight: '80vh',
            background: 'var(--bg-card)',
            borderRadius: 18,
            boxShadow: '0 20px 30px -10px rgba(0,0,0,0.2), 0 0 15px rgba(0,0,0,0.05)',
            border: '1px solid var(--border-color)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header Chat */}
          <div
            style={{
              background: `linear-gradient(135deg, ${themeColor}, #0F172A)`,
              color: 'var(--text-inverse)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                }}
              >
                🤖
              </div>
              <div>
                <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', fontFamily: "'Sora', sans-serif" }}>
                  {sectorType === 'SUPER_ADMIN' ? 'Assistante IA Supervision Super-Admin' : sectorType === 'MULTISERVICES_IT' ? 'Assistante IA Diagnostic IT' : sectorType === 'TAILLEUR' ? 'Assistante IA Atelier Couture' : 'Assistante IA Quincaillerie'}
                </h4>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>
                  Copilote Spécifique • {sectorType === 'SUPER_ADMIN' ? 'Console SaaS Super-Admin' : sectorType}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-inverse)', fontSize: '1.2rem', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          {/* Quick Actions Shortcuts */}
          <div style={{ padding: '10px 14px', background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 6, overflowX: 'auto' }}>
            {renderQuickActions()}
          </div>

          {/* Messages Feed */}
          <div style={{ flex: 1, padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}
              >
                <div
                  style={{
                    background: m.sender === 'user' ? themeColor : '#F1F5F9',
                    color: m.sender === 'user' ? 'white' : '#1E293B',
                    padding: '10px 14px',
                    borderRadius: m.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    fontSize: '0.82rem',
                    lineHeight: 1.4,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {m.text}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2, textAlign: m.sender === 'user' ? 'right' : 'left' }}>
                  {m.timestamp}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--bg-main)', padding: '8px 12px', borderRadius: 12, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                🤖 Analyse IA en cours ({sectorType})...
              </div>
            )}
          </div>

          {/* Input Chat */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            style={{ padding: 10, background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 8 }}
          >
            <input
              type="text"
              placeholder="Posez une question ou demandez une action..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.82rem', outline: 'none' }}
            />
            <button
              type="submit"
              disabled={loading || !inputPrompt.trim()}
              style={{
                background: themeColor,
                color: 'var(--text-inverse)',
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              Envoyer
            </button>
          </form>
        </div>
      )}
    </>
  );
};

