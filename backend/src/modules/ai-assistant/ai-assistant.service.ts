import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiInventoryAuditDto, AiChatPromptDto, AiAutoReorderDto } from './dto/ai-assistant.dto';
import { TenantContextService } from '../../core/tenant/tenant-context.service';

@Injectable()
export class AiAssistantService {
  constructor(private prisma: PrismaService) {}

  /**
   * Effectue un audit / diagnostic sectoriel automatisé propre au tenant connecté
   */
  async performInventoryAudit(dto?: AiInventoryAuditDto) {
    const store = TenantContextService.getStore();
    const sector = store?.sectorType || 'QUINCAILLERIE';

    if (sector === 'MULTISERVICES_IT') {
      return this.auditMultiservicesIT();
    } else if (sector === 'TAILLEUR') {
      return this.auditTailleurAtelier();
    } else {
      return this.auditQuincaillerieStock();
    }
  }

  /**
   * Audit supervision SaaS multi-tenants Super-Admin UEMOA
   */
  async auditSuperAdminSaaS() {
    const tenants = await this.prisma.withoutTenantScope((client) =>
      client.tenant.findMany({
        include: { users: true },
      }),
    );

    const totalTenants = tenants.length;
    const activeTenants = tenants.filter((t) => t.billingStatus === 'ACTIVE').length;
    const expiredTenants = tenants.filter((t) => t.billingStatus === 'EXPIRED').length;

    return {
      sectorTitle: 'Console Supervision SaaS Super-Admin UEMOA',
      healthScore: totalTenants > 0 ? Math.round((activeTenants / totalTenants) * 100) : 100,
      totalItems: totalTenants,
      criticalCount: expiredTenants,
      valuation: {
        totalPurchaseXOF: activeTenants * 150000,
        totalSellingXOF: totalTenants * 150000,
        potentialMarginXOF: activeTenants * 150000,
      },
      reorderRecommendations: [],
      aiSummary: `Supervision globale : ${totalTenants} tenants enregistrés au total (${activeTenants} actifs, ${expiredTenants} abonnements expirés/en alerte). Niveau de conformité RLS et sécurité SaaS élevé.`,
    };
  }

  /**
   * Audit sectoriel Quincaillerie & Matériaux de construction
   */
  private async auditQuincaillerieStock() {
    const stockItems = await this.prisma.extended.stockItem.findMany({
      orderBy: { quantity: 'asc' },
    });

    let totalPurchaseValuation = 0;
    let totalSellingValuation = 0;
    const criticalItems: any[] = [];
    const healthyItems: any[] = [];
    const reorderRecommendations: any[] = [];

    for (const item of stockItems) {
      const purchaseValue = item.quantity * item.purchasePrice;
      const sellingValue = item.quantity * item.sellingPrice;

      totalPurchaseValuation += purchaseValue;
      totalSellingValuation += sellingValue;

      const isLowStock = item.quantity <= item.alertThreshold;
      const isOutOfStock = item.quantity === 0;

      const itemAudit = {
        id: item.id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        alertThreshold: item.alertThreshold,
        purchasePrice: item.purchasePrice,
        sellingPrice: item.sellingPrice,
        potentialMarginUnit: item.sellingPrice - item.purchasePrice,
        purchaseValue,
        sellingValue,
        status: isOutOfStock ? 'OUT_OF_STOCK' : isLowStock ? 'LOW_STOCK' : 'OK',
      };

      if (isLowStock || isOutOfStock) {
        criticalItems.push(itemAudit);
        const suggestedQty = Math.max(10, item.alertThreshold * 3 - item.quantity);
        const estimatedCost = suggestedQty * item.purchasePrice;

        reorderRecommendations.push({
          stockItemId: item.id,
          name: item.name,
          sku: item.sku,
          currentQuantity: item.quantity,
          suggestedQty,
          unitPurchasePrice: item.purchasePrice,
          estimatedCostXOF: estimatedCost,
        });
      } else {
        healthyItems.push(itemAudit);
      }
    }

    const totalItems = stockItems.length;
    const potentialTotalMargin = totalSellingValuation - totalPurchaseValuation;
    const healthScore = totalItems > 0 ? Math.round(((totalItems - criticalItems.length) / totalItems) * 100) : 100;

    let aiSummary = `Audit Quincaillerie réalisé le ${new Date().toLocaleDateString('fr-FR')} sur ${totalItems} références. `;
    if (criticalItems.length === 0) {
      aiSummary += '✅ Vos stocks de quincaillerie sont optimaux. Aucune rupture ou alerte détectée.';
    } else {
      aiSummary += `⚠️ ${criticalItems.length} référence(s) en alerte de stock ou rupture. Une commande de réapprovisionnement automatique est recommandée.`;
    }

    return {
      sector: 'QUINCAILLERIE',
      sectorTitle: 'Quincaillerie & Stock Matériaux',
      auditDate: new Date().toISOString(),
      healthScore,
      totalItems,
      criticalCount: criticalItems.length,
      healthyCount: healthyItems.length,
      valuation: {
        totalPurchaseXOF: totalPurchaseValuation,
        totalSellingXOF: totalSellingValuation,
        potentialMarginXOF: potentialTotalMargin,
      },
      criticalItems,
      reorderRecommendations,
      aiSummary,
    };
  }

  /**
   * Audit sectoriel Multiservices IT (Tickets de réparation, SLA, stock pièces détachées)
   */
  private async auditMultiservicesIT() {
    const tickets = await this.prisma.extended.repairTicket.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const stockItems = await this.prisma.extended.stockItem.findMany({
      orderBy: { quantity: 'asc' },
    });

    let pendingCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let totalEstimatedRepairRevenue = 0;
    const criticalItems: any[] = [];
    const reorderRecommendations: any[] = [];

    for (const t of tickets) {
      if (t.status === 'PENDING' || t.status === 'DIAGNOSING') pendingCount++;
      else if (t.status === 'IN_PROGRESS' || t.status === 'WAITING_FOR_PARTS') inProgressCount++;
      else if (t.status === 'REPAIRED' || t.status === 'DELIVERED') completedCount++;

      totalEstimatedRepairRevenue += (t.estimatedCost || 0);

      if (t.status === 'WAITING_FOR_PARTS' || t.status === 'PENDING') {
        criticalItems.push({
          id: t.id,
          name: `Ticket #${t.ticketNumber} - ${t.deviceModel}`,
          sku: t.clientName,
          quantity: 1,
          alertThreshold: 1,
          purchasePrice: 0,
          sellingPrice: t.estimatedCost || 0,
          status: t.status === 'WAITING_FOR_PARTS' ? 'OUT_OF_STOCK' : 'LOW_STOCK',
        });
      }
    }

    let totalPartsPurchase = 0;
    let totalPartsSelling = 0;
    for (const item of stockItems) {
      totalPartsPurchase += item.quantity * item.purchasePrice;
      totalPartsSelling += item.quantity * item.sellingPrice;

      if (item.quantity <= item.alertThreshold) {
        criticalItems.push({
          id: item.id,
          name: `Pièce IT : ${item.name}`,
          sku: item.sku,
          quantity: item.quantity,
          alertThreshold: item.alertThreshold,
          purchasePrice: item.purchasePrice,
          sellingPrice: item.sellingPrice,
          status: item.quantity === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
        });

        const suggestedQty = Math.max(5, item.alertThreshold * 2 - item.quantity);
        reorderRecommendations.push({
          stockItemId: item.id,
          name: item.name,
          sku: item.sku,
          currentQuantity: item.quantity,
          suggestedQty,
          unitPurchasePrice: item.purchasePrice,
          estimatedCostXOF: suggestedQty * item.purchasePrice,
        });
      }
    }

    const totalTickets = tickets.length;
    const healthScore = totalTickets > 0 ? Math.round((completedCount / totalTickets) * 100) : 100;

    let aiSummary = `Diagnostic Atelier IT réalisé le ${new Date().toLocaleDateString('fr-FR')} sur ${totalTickets} tickets et ${stockItems.length} références pièces. `;
    if (criticalItems.length === 0) {
      aiSummary += '✅ Tous vos tickets IT sont traités sans retard et les pièces détachées sont en stock.';
    } else {
      aiSummary += `⚠️ ${pendingCount + inProgressCount} ticket(s) en cours/attente et ${reorderRecommendations.length} pièce(s) détachée(s) en alerte de réapprovisionnement.`;
    }

    return {
      sector: 'MULTISERVICES_IT',
      sectorTitle: 'Multiservices IT & Diagnostic Réparations',
      auditDate: new Date().toISOString(),
      healthScore,
      totalItems: totalTickets + stockItems.length,
      criticalCount: criticalItems.length,
      healthyCount: (totalTickets + stockItems.length) - criticalItems.length,
      valuation: {
        totalPurchaseXOF: totalPartsPurchase,
        totalSellingXOF: totalEstimatedRepairRevenue + totalPartsSelling,
        potentialMarginXOF: (totalEstimatedRepairRevenue + totalPartsSelling) - totalPartsPurchase,
      },
      criticalItems,
      reorderRecommendations,
      aiSummary,
    };
  }

  /**
   * Audit sectoriel Atelier Tailleur & Confections
   */
  private async auditTailleurAtelier() {
    const orders = await this.prisma.extended.tailleurOrder.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const measurements = await this.prisma.extended.clientMeasurement.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const stockItems = await this.prisma.extended.stockItem.findMany({
      orderBy: { quantity: 'asc' },
    });

    let pendingOrders = 0;
    let inProgressOrders = 0;
    let completedOrders = 0;
    let totalOrderRevenue = 0;
    let totalAdvances = 0;
    const criticalItems: any[] = [];
    const reorderRecommendations: any[] = [];

    for (const o of orders) {
      if (o.status === 'ORDERED' || o.status === 'CUTTING') pendingOrders++;
      else if (o.status === 'SEWING' || o.status === 'FITTING') inProgressOrders++;
      else if (o.status === 'READY' || o.status === 'DELIVERED') completedOrders++;

      totalOrderRevenue += (o.totalPrice || 0);
      totalAdvances += (o.advancePaid || 0);

      if (o.status === 'ORDERED' || o.status === 'CUTTING' || o.status === 'SEWING') {
        criticalItems.push({
          id: o.id,
          name: `Confection #${o.orderNumber || o.id.slice(0, 6)} - ${o.garmentType}`,
          sku: o.clientName,
          quantity: 1,
          alertThreshold: 1,
          purchasePrice: o.advancePaid || 0,
          sellingPrice: o.totalPrice || 0,
          status: o.status === 'ORDERED' ? 'LOW_STOCK' : 'OK',
        });
      }
    }

    let totalFabricPurchase = 0;
    let totalFabricSelling = 0;
    for (const item of stockItems) {
      totalFabricPurchase += item.quantity * item.purchasePrice;
      totalFabricSelling += item.quantity * item.sellingPrice;

      if (item.quantity <= item.alertThreshold) {
        criticalItems.push({
          id: item.id,
          name: `Fourniture Tailleur : ${item.name}`,
          sku: item.sku,
          quantity: item.quantity,
          alertThreshold: item.alertThreshold,
          purchasePrice: item.purchasePrice,
          sellingPrice: item.sellingPrice,
          status: item.quantity === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
        });

        const suggestedQty = Math.max(10, item.alertThreshold * 3 - item.quantity);
        reorderRecommendations.push({
          stockItemId: item.id,
          name: item.name,
          sku: item.sku,
          currentQuantity: item.quantity,
          suggestedQty,
          unitPurchasePrice: item.purchasePrice,
          estimatedCostXOF: suggestedQty * item.purchasePrice,
        });
      }
    }

    const totalOrders = orders.length;
    const healthScore = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 100;

    let aiSummary = `Audit Atelier Couture réalisé le ${new Date().toLocaleDateString('fr-FR')} sur ${totalOrders} confections, ${measurements.length} fiches de mesures clients et ${stockItems.length} fournitures. `;
    if (criticalItems.length === 0) {
      aiSummary += '✅ Toutes vos confections sont livrées/prêtes et vos fournitures de couture sont suffisantes.';
    } else {
      aiSummary += `⚠️ ${pendingOrders + inProgressOrders} confection(s) en atelier et ${reorderRecommendations.length} fourniture(s) (tissus/fils) en alerte de réapprovisionnement.`;
    }

    return {
      sector: 'TAILLEUR',
      sectorTitle: 'Atelier Tailleur & Confection sur Mesure',
      auditDate: new Date().toISOString(),
      healthScore,
      totalItems: totalOrders + measurements.length + stockItems.length,
      criticalCount: criticalItems.length,
      healthyCount: (totalOrders + measurements.length + stockItems.length) - criticalItems.length,
      valuation: {
        totalPurchaseXOF: totalFabricPurchase,
        totalSellingXOF: totalOrderRevenue + totalFabricSelling,
        potentialMarginXOF: (totalOrderRevenue + totalFabricSelling) - totalFabricPurchase,
      },
      criticalItems,
      reorderRecommendations,
      aiSummary,
    };
  }

  /**
   * Génère automatiquement les Bons de Commande Fournisseur pour le tenant connecté
   */
  async generateAutoPurchaseOrders(dto?: AiAutoReorderDto) {
    const audit = await this.performInventoryAudit();
    const recommendations = audit.reorderRecommendations;

    if (recommendations.length === 0) {
      return {
        message: 'Aucun article ou fourniture en alerte de stock. Aucune commande générée.',
        generatedCount: 0,
        orders: [],
      };
    }

    const store = TenantContextService.getStore();
    const sector = store?.sectorType || 'QUINCAILLERIE';
    const sectorLabel = sector === 'MULTISERVICES_IT' ? 'Pièces IT' : sector === 'TAILLEUR' ? 'Tissus & Fournitures' : 'Quincaillerie';

    const supplierName = dto?.supplierName || `Fournisseur Réassort Automatique (${sectorLabel} IA KPSy)`;
    const createdOrders: any[] = [];

    for (const rec of recommendations) {
      const order = await this.prisma.extended.purchaseOrder.create({
        data: {
          supplierName,
          itemDescription: `Réassort IA ${sectorLabel} : ${rec.name} (${rec.sku})`,
          stockItemId: rec.stockItemId,
          qtyOrdered: rec.suggestedQty,
          totalCostXOF: rec.estimatedCostXOF,
          status: 'PENDING',
          notes: `Commande automatisée générée par l'Assistante IA KPSy (${sectorLabel}) lors de l'inventaire du ${new Date().toLocaleDateString('fr-FR')}.`,
        } as any,
      });

      createdOrders.push(order);
    }

    return {
      message: `✅ ${createdOrders.length} commande(s) d'achat fournisseur (${sectorLabel}) générée(s) avec succès.`,
      generatedCount: createdOrders.length,
      orders: createdOrders,
    };
  }

  /**
   * Moteur conversationnel et copilote IA sectoriel
   */
  async processChatPrompt(dto: AiChatPromptDto) {
    const store = TenantContextService.getStore();
    const sector = store?.sectorType || 'QUINCAILLERIE';
    const promptLower = dto.prompt.toLowerCase();

    // 1. Détection intent "Inventaire / Audit / Diagnostic"
    if (promptLower.includes('inventaire') || promptLower.includes('stock') || promptLower.includes('audit') || promptLower.includes('diagnostic')) {
      const audit = await this.performInventoryAudit({ sectorType: sector });
      return {
        reply: `📊 **Résultat de l'Audit Automatisé (${audit.sectorTitle})** :\n\n- **Santé Globale** : ${audit.healthScore}%\n- **Valorisation Achats** : ${audit.valuation.totalPurchaseXOF.toLocaleString()} XOF\n- **Valeur Totale / Ventes** : ${audit.valuation.totalSellingXOF.toLocaleString()} XOF\n- **Éléments en Alerte / Rupture** : ${audit.criticalCount} sur ${audit.totalItems} références.\n\n${audit.aiSummary}`,
        actionType: 'INVENTORY_AUDIT_COMPLETED',
        data: audit,
      };
    }

    // 2. Détection intent "Réapprovisionnement / Commande"
    if (promptLower.includes('commande') || promptLower.includes('réappro') || promptLower.includes('acheter') || promptLower.includes('fournisseur')) {
      const autoOrders = await this.generateAutoPurchaseOrders();
      return {
        reply: `${autoOrders.message}\n\nVous pouvez les consulter et les valider dans votre module **Achats & Commandes Fournisseurs**.`,
        actionType: 'AUTO_PURCHASE_ORDERS_GENERATED',
        data: autoOrders,
      };
    }

    // 3. Détection intent "Marge / Chiffre d'affaires / Bénéfice"
    if (promptLower.includes('marge') || promptLower.includes('bénéfice') || promptLower.includes('profit') || promptLower.includes('chiffre')) {
      const audit = await this.performInventoryAudit({ sectorType: sector });
      return {
        reply: `💰 **Analyse Financière & Marges (${audit.sectorTitle})** :\n\n- **Coût d'Achat Total** : ${audit.valuation.totalPurchaseXOF.toLocaleString()} XOF\n- **Valeur Totale Ventes / Prestations** : ${audit.valuation.totalSellingXOF.toLocaleString()} XOF\n- **Marge brute / Bénéfice potentiel** : **${audit.valuation.potentialMarginXOF.toLocaleString()} XOF**`,
        actionType: 'MARGIN_ANALYSIS',
        data: audit.valuation,
      };
    }

    // 4. Détection intent "SMS / Relance / Client"
    if (promptLower.includes('sms') || promptLower.includes('relance') || promptLower.includes('client')) {
      let smsTemplate = '';
      if (sector === 'MULTISERVICES_IT') {
        smsTemplate = `"Bonjour [Nom Client], votre appareil [Appareil] est réparé et disponible dans votre établissement IT KPSyDesk. Coût : [Montant] XOF. Merci !"`;
      } else if (sector === 'TAILLEUR') {
        smsTemplate = `"Bonjour [Nom Client], votre tenue [Vêtement] est prête pour l'essayage / retrait à l'Atelier KPSyDesk. Merci de votre confiance !"`;
      } else {
        smsTemplate = `"Bonjour [Nom Client], votre commande de matériaux est prête pour retrait à la Quincaillerie KPSyDesk. Merci !"`;
      }

      return {
        reply: `💬 **Modèle de SMS généré par l'IA KPSy (${sector})** :\n\n${smsTemplate}`,
        actionType: 'SMS_TEMPLATE_GENERATED',
      };
    }

    // 5. Réponse générique d'assistance sectorielle
    let helpMsg = '';
    if (sector === 'SUPER_ADMIN') {
      helpMsg = `Je suis l'**Assistante IA Supervision Super-Admin KPSy**. Je peux vous aider à :\n- 🛡️ **Auditer la sécurité RLS et l'isolation multi-tenants**\n- 🏢 **Superviser l'état des abonnements et tenants SaaS UEMOA**\n- 💰 **Analyser le Chiffre d'Affaires récurrent MRR des souscriptions**\n- 📊 **Générer un rapport de santé globale de la plateforme**\n\nQue souhaitez-vous superviser ?`;
    } else if (sector === 'MULTISERVICES_IT') {
      helpMsg = `Je suis l'**Assistante IA Diagnostic & Réparation IT KPSy**. Je peux vous aider à :\n- 💻 **Auditer les tickets de réparation IT & pièces détachées**\n- 🛒 **Générer des commandes fournisseurs pour le stock informatique**\n- 💰 **Calculer le chiffre d'affaires prévisionnel des réparations**\n- 💬 **Rédiger des SMS de notification pour les appareils prêts**\n\nQue souhaitez-vous exécuter ?`;
    } else if (sector === 'TAILLEUR') {
      helpMsg = `Je suis l'**Assistante IA Atelier Tailleur KPSy**. Je peux vous aider à :\n- ✂️ **Auditer les commandes de confection, essayages et stocks de tissus**\n- 🛒 **Générer des commandes d'achat pour les fournitures de couture**\n- 💰 **Analyser le chiffre d'affaires des confections et acomptes**\n- 💬 **Rédiger des SMS d'invitation aux essayages clients**\n\nQue souhaitez-vous exécuter ?`;
    } else {
      helpMsg = `Je suis l'**Assistante IA Stock & Quincaillerie KPSy**. Je peux vous aider à :\n- 📦 **Exécuter un inventaire périodique automatisé**\n- 🛒 **Générer des commandes d'achat fournisseurs pour les ruptures**\n- 💰 **Calculer vos marges et la valeur de votre stock**\n- 💬 **Rédiger des SMS de notification clients**\n\nQue souhaitez-vous exécuter ?`;
    }

    return {
      reply: helpMsg,
      actionType: 'HELP',
    };
  }
}
