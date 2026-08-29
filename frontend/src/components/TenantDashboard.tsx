import { StorageService } from '../services/storage';
import React, { useState, useEffect } from 'react';
import { Sidebar } from './layout/Sidebar';
import { TopHeader } from './layout/TopHeader';
import { Modal } from './shared/Modal';
import { SubscriptionExpiredBanner } from './SubscriptionExpiredBanner';
import { BusinessBillingManager } from './shared/BusinessBillingManager';
import { TailleurOrderManager } from './tailleur/TailleurOrderManager';
import { TailleurFittingsManager } from './tailleur/TailleurFittingsManager';
import { TailleurCatalogManager } from './tailleur/TailleurCatalogManager';
import { TailleurMeasurementsManager } from './tailleur/TailleurMeasurementsManager';
import { TailleurTasksKanban } from './tailleur/TailleurTasksKanban';

import { ITTicketsManager } from './multiservices-it/ITTicketsManager';
import { ITSlaManager } from './multiservices-it/ITSlaManager';

import { ITPrestationsCatalog } from './multiservices-it/ITPrestationsCatalog';
import { ITHardwareSalesManager } from './multiservices-it/ITHardwareSalesManager';
import { ITSparePartsStock } from './multiservices-it/ITSparePartsStock';
import { ITClientsHistory } from './multiservices-it/ITClientsHistory';
import { QuincaillerieStockManager } from './quincaillerie/QuincaillerieStockManager';
import QuincailleriePOS from './quincaillerie/QuincailleriePOS';
import { QuincaillerieMovementsManager } from './quincaillerie/QuincaillerieMovementsManager';
import { QuincaillerieMarginReports } from './quincaillerie/QuincaillerieMarginReports';
import { QuincailleriePurchasesManager } from './quincaillerie/QuincailleriePurchasesManager';
import QuincaillerieDepotsManager from './quincaillerie/QuincaillerieDepotsManager';
import { TenantSettings } from './shared/TenantSettings';
import { TenantEmployeesManager } from './shared/TenantEmployeesManager';
import { TenantSubscriptionManager } from './shared/TenantSubscriptionManager';
import { ContactsCrmView } from './crm/ContactsCrmView';

import { UserGuideManager } from './shared/UserGuideManager';
import { AboutAppManager } from './shared/AboutAppManager';
import { AiAssistantWidget } from './shared/AiAssistantWidget';
import { QuincaillerieOverview } from './quincaillerie/QuincaillerieOverview';
import { TailleurOverview } from './tailleur/TailleurOverview';
import { ITOverview } from './multiservices-it/ITOverview';

import { AiInventoryAuditManager } from './shared/AiInventoryAuditManager';
import { ErrorBoundary } from './shared/ErrorBoundary';





interface Props {
  onLogout: () => void;
}

interface StockItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  alertThreshold: number;
}

interface RepairTicket {
  id: string;
  ticketNumber: string;
  clientName: string;
  clientPhone: string;
  deviceModel: string;
  issueDesc: string;
  status: string;
  estimatedCost?: number;
}

interface ClientMeasurement {
  id: string;
  clientName: string;
  clientPhone: string;
  garmentType: string;
  measurements: Record<string, any>;
  notes?: string;
}

export const TenantDashboard: React.FC<Props> = ({ onLogout }) => {
  const user = JSON.parse(localStorage.getItem('kpsy_user') || '{}');
  const tenant = JSON.parse(localStorage.getItem('kpsy_tenant') || '{}');
  const sector = tenant?.sectorType || 'QUINCAILLERIE';

  const [activeTab, setActiveTab] = useState('overview');
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [measurements, setMeasurements] = useState<ClientMeasurement[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [newStock, setNewStock] = useState({ name: '', sku: '', unit: 'pièce', purchasePrice: 0, sellingPrice: 0, quantity: 10, alertThreshold: 5 });
  const [newTicket, setNewTicket] = useState({ clientName: '', clientPhone: '', deviceModel: '', issueDesc: '', estimatedCost: 5000 });
  const [newMeasurement, setNewMeasurement] = useState({ clientName: '', clientPhone: '', garmentType: 'Boubou', chest: 95, waist: 88, length: 140, notes: '' });

  const getThemeColor = () => {
    switch (sector) {
      case 'QUINCAILLERIE':
        return '#059669';
      case 'MULTISERVICES_IT':
        return '#0D9488';
      case 'TAILLEUR':
        return '#6B21A8';
      default:
        return '#2563EB';
    }
  };

  const themeColor = getThemeColor();

  const fetchData = async () => {
    setLoading(true);
    let token;
    StorageService.get("kpsy_token").then(t => token = t);
    // FIXME: token fetch is now async, might break sync logic
    const headers = { Authorization: `Bearer ${token}` };

    try {
      let res;
      if (sector === 'QUINCAILLERIE') {
        res = await fetch('/api/quincaillerie/stock', { headers });
      } else if (sector === 'MULTISERVICES_IT') {
        res = await fetch('/api/multiservices-it/tickets', { headers });
      } else if (sector === 'TAILLEUR') {
        res = await fetch('/api/tailleur/measurements', { headers });
      }

      if (res?.status === 402) {
        setIsExpired(true);
        return;
      }

      if (res?.ok) {
        const data = await res.json();
        if (sector === 'QUINCAILLERIE') setStockItems(data);
        else if (sector === 'MULTISERVICES_IT') setTickets(data);
        else if (sector === 'TAILLEUR') setMeasurements(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sector]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    let token;
    StorageService.get("kpsy_token").then(t => token = t);
    // FIXME: token fetch is now async, might break sync logic
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    try {
      if (sector === 'QUINCAILLERIE') {
        await fetch('/api/quincaillerie/stock', { method: 'POST', headers, body: JSON.stringify(newStock) });
      } else if (sector === 'MULTISERVICES_IT') {
        await fetch('/api/multiservices-it/tickets', { method: 'POST', headers, body: JSON.stringify(newTicket) });
      } else if (sector === 'TAILLEUR') {
        await fetch('/api/tailleur/measurements', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            clientName: newMeasurement.clientName,
            clientPhone: newMeasurement.clientPhone,
            garmentType: newMeasurement.garmentType,
            measurements: { tourPoitrine: newMeasurement.chest, tourTaille: newMeasurement.waist, longueur: newMeasurement.length },
            notes: newMeasurement.notes,
          }),
        });
      }
      setShowModal(false);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (isExpired) {
    return (
      <SubscriptionExpiredBanner
        tenantName={tenant?.name || 'Entreprise'}
        tenantCode={tenant?.code || 'TNT'}
        onSubmitted={() => {
          setIsExpired(false);
          fetchData();
        }}
        onLogout={onLogout}
      />
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* ── Sidebar Latérale ── */}
      <Sidebar
        sector={sector}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        themeColor={themeColor}
        tenantName={tenant?.name || 'Mon Entreprise'}
      />

      {/* ── Zone Principale ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        {/* Top Header Extrait (Zero Duplication) */}
        <TopHeader
          tenantName={tenant?.name || 'Mon Espace'}
          tenantCode={tenant?.code || 'TNT'}
          sector={sector}
          userName={user?.fullName || user?.username}
          themeColor={themeColor}
          onLogout={onLogout}
        />

        {/* Main Content */}
        <main style={{ padding: '32px 36px', maxWidth: 1280, width: '100%', margin: '0 auto' }}>
          {/* 1. ONGLET DEVIS & FACTURES GENÉRIQUE */}

          {activeTab === 'billing' && (
            <BusinessBillingManager sector={sector} themeColor={themeColor} />
          )}

          {activeTab === 'crm' && (
            <ContactsCrmView />
          )}

          {/* 2. ONGLETS SPÉCIFIQUES TAILLEUR */}
          {activeTab === 'measurements' && sector === 'TAILLEUR' && <TailleurMeasurementsManager themeColor={themeColor} />}
          {activeTab === 'orders' && sector === 'TAILLEUR' && <TailleurOrderManager themeColor={themeColor} />}
          {activeTab === 'mytasks' && sector === 'TAILLEUR' && <TailleurTasksKanban themeColor={themeColor} />}
          {activeTab === 'fittings' && sector === 'TAILLEUR' && <TailleurFittingsManager themeColor={themeColor} />}
          {activeTab === 'services' && sector === 'TAILLEUR' && <TailleurCatalogManager themeColor={themeColor} />}


          {/* 3. ONGLETS SPÉCIFIQUES MULTISERVICES IT */}
          {activeTab === 'tickets' && sector === 'MULTISERVICES_IT' && <ITTicketsManager themeColor={themeColor} />}
          {activeTab === 'sla' && sector === 'MULTISERVICES_IT' && <ITSlaManager themeColor={themeColor} />}
          {activeTab === 'services' && sector === 'MULTISERVICES_IT' && <ITPrestationsCatalog themeColor={themeColor} />}

          {activeTab === 'sales' && sector === 'MULTISERVICES_IT' && <ITHardwareSalesManager themeColor={themeColor} />}
          {activeTab === 'stock' && sector === 'MULTISERVICES_IT' && <ITSparePartsStock themeColor={themeColor} />}
          {activeTab === 'customers' && sector === 'MULTISERVICES_IT' && <ITClientsHistory themeColor={themeColor} />}

          {/* 4. ONGLETS SPÉCIFIQUES QUINCAILLERIE */}
          {activeTab === 'stock' && sector === 'QUINCAILLERIE' && (
            <QuincaillerieStockManager themeColor={themeColor} onStockUpdated={fetchData} />
          )}
          {activeTab === 'depots' && sector === 'QUINCAILLERIE' && (
            <ErrorBoundary><QuincaillerieDepotsManager /></ErrorBoundary>
          )}
          {activeTab === 'sales' && sector === 'QUINCAILLERIE' && (
            <ErrorBoundary><QuincailleriePOS /></ErrorBoundary>
          )}
          {activeTab === 'movements' && sector === 'QUINCAILLERIE' && (
            <QuincaillerieMovementsManager themeColor={themeColor} />
          )}
          {activeTab === 'purchases' && sector === 'QUINCAILLERIE' && (
            <QuincailleriePurchasesManager themeColor={themeColor} />
          )}
          {activeTab === 'reports' && sector === 'QUINCAILLERIE' && (
            <QuincaillerieMarginReports themeColor={themeColor} />
          )}

          {/* 5. GESTION DES COLLABORATEURS & PERMISSIONS */}
          {activeTab === 'employees' && (
            <TenantEmployeesManager sector={sector} themeColor={themeColor} />
          )}


          {/* 6. PARAMÈTRES RÉUTILISABLES */}


          {activeTab === 'settings' && (
            <TenantSettings
              tenantName={tenant?.name || 'Mon Entreprise'}
              tenantCode={tenant?.code || 'TNT'}
              sector={sector}
              themeColor={themeColor}
            />
          )}

          {/* 7. GUIDE D'UTILISATION & À PROPOS */}
          {activeTab === 'guide' && <UserGuideManager sector={sector} themeColor={themeColor} />}
          {activeTab === 'about' && <AboutAppManager themeColor={themeColor} />}

          {/* 8. ASSISTANTE IA & INVENTAIRE PÉRIODIQUE */}
          {activeTab === 'ai-assistant' && (
            <AiInventoryAuditManager themeColor={themeColor} sectorType={sector} />
          )}




          {/* 3. VUE OVERVIEW */}
          {activeTab === 'subscription' && (
            <TenantSubscriptionManager themeColor={themeColor} />
          )}

          {activeTab === 'overview' && (
            <>
              {sector === 'QUINCAILLERIE' && <QuincaillerieOverview themeColor={themeColor} />}
              {sector === 'TAILLEUR' && <TailleurOverview themeColor={themeColor} />}
              {sector === 'MULTISERVICES_IT' && <ITOverview themeColor={themeColor} />}
            </>
          )}


          {/* 3. TABLEAUX SECTORIELS BRUTS (Stock / Tickets) */}
          {(activeTab === 'stock' || activeTab === 'items' || activeTab === 'tickets') && (

            <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              {sector === 'QUINCAILLERIE' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Nom Article</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>SKU</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Prix Achat</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Prix Vente</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Quantité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockItems.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 600 }}>{item.name}</td>
                        <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{item.sku}</td>
                        <td style={{ padding: '14px 20px' }}>{item.purchasePrice.toLocaleString()} XOF</td>
                        <td style={{ padding: '14px 20px', fontWeight: 700, color: '#059669' }}>{item.sellingPrice.toLocaleString()} XOF</td>
                        <td style={{ padding: '14px 20px', fontWeight: 700 }}>{item.quantity} {item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {sector === 'MULTISERVICES_IT' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>N° Ticket</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Client</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Appareil</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 700, color: themeColor }}>{t.ticketNumber}</td>
                        <td style={{ padding: '14px 20px' }}>{t.clientName}</td>
                        <td style={{ padding: '14px 20px' }}>{t.deviceModel}</td>
                        <td style={{ padding: '14px 20px', fontWeight: 700 }}>{t.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {sector === 'TAILLEUR' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Client</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Vêtement</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Mesures (cm)</th>

                    </tr>
                  </thead>
                  <tbody>
                    {measurements.map((m) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 700 }}>{m.clientName}</td>
                        <td style={{ padding: '14px 20px' }}>{m.garmentType}</td>
                        <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{JSON.stringify(m.measurements)}</td>
                      </tr>

                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Widget Flottant Assistante IA KPSy (Accessible partout) */}
      <AiAssistantWidget themeColor={themeColor} sectorType={sector} />
    </div>
  );
};

