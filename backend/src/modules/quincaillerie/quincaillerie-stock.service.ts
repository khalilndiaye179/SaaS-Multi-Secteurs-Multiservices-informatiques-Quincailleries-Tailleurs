import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStockItemDto, UpdateStockItemDto, RecordMovementDto, TransferStockDto } from './dto/stock.dto';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { BillingSequenceService } from '../billing/billing-sequence.service';
import { BillingDocumentType } from '@prisma/client';

@Injectable()
export class QuincaillerieStockService {
  constructor(
    private prisma: PrismaService,
    private billingSequence: BillingSequenceService,
  ) {}

  async findAll() {
    return this.prisma.extended.stockItem.findMany({
      include: { balances: { include: { depot: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findAlerts() {
    const items = await this.prisma.extended.stockItem.findMany();
    return items.filter((item) => item.quantity <= item.alertThreshold);
  }

  async create(dto: CreateStockItemDto) {
    return this.prisma.extended.$transaction(async (tx) => {
      const { depotId, ...itemData } = dto;
      
      const item = await tx.stockItem.create({
        data: itemData as any,
      });

      if (depotId && item.quantity > 0) {
        await tx.stockBalance.create({
          data: {
            stockItemId: item.id,
            depotId: depotId,
            quantity: item.quantity,
          } as any
        });
      }

      return item;
    });
  }

  async update(id: string, dto: UpdateStockItemDto) {
    const item = await this.prisma.extended.stockItem.findFirst({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException('Article introuvable dans votre stock.');
    }

    return this.prisma.extended.stockItem.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const item = await this.prisma.extended.stockItem.findFirst({
      where: { id },
      include: {
        movements: { take: 1 },
        invoiceLines: { take: 1 },
        quoteLines: { take: 1 },
        purchaseOrders: { take: 1 },
        inventoryLines: { take: 1 },
        repairParts: { take: 1 },
      }
    });
    if (!item) throw new NotFoundException('Article introuvable dans votre stock.');

    const hasHistory = item.movements.length > 0 || item.invoiceLines.length > 0 || 
                       item.quoteLines.length > 0 || item.purchaseOrders.length > 0 || 
                       item.inventoryLines.length > 0 || item.repairParts.length > 0;

    if (hasHistory) {
      throw new BadRequestException("Cet article possède un historique (mouvements, factures, etc.) et ne peut pas être supprimé. L'archivage sera bientôt disponible.");
    }

    return this.prisma.extended.stockItem.delete({ where: { id } });
  }

  async transferStock(dto: TransferStockDto) {
    return this.prisma.extended.$transaction(async (tx) => {
      const item = await tx.stockItem.findFirst({ where: { id: dto.stockItemId } });
      if (!item) throw new NotFoundException('Article introuvable.');

      const sourceBalance = await tx.stockBalance.findUnique({
        where: { stockItemId_depotId: { stockItemId: dto.stockItemId, depotId: dto.sourceDepotId } }
      });

      if (!sourceBalance || sourceBalance.quantity < dto.quantity) {
        throw new BadRequestException('Stock insuffisant dans le dépôt source.');
      }

      // Décrémenter source
      await tx.stockBalance.update({
        where: { id: sourceBalance.id },
        data: { quantity: sourceBalance.quantity - dto.quantity }
      });

      // Incrémenter ou créer destination
      const destBalance = await tx.stockBalance.findUnique({
        where: { stockItemId_depotId: { stockItemId: dto.stockItemId, depotId: dto.destinationDepotId } }
      });

      if (destBalance) {
        await tx.stockBalance.update({
          where: { id: destBalance.id },
          data: { quantity: destBalance.quantity + dto.quantity }
        });
      } else {
        await tx.stockBalance.create({
          data: {
            stockItemId: dto.stockItemId,
            depotId: dto.destinationDepotId,
            quantity: dto.quantity,
          } as any
        });
      }

      // Enregistrer le mouvement de transfert (OUT côté source, ou TYPE spécifique si on avait TRANSFER)
      // On va juste enregistrer un OUT et un IN
      await tx.stockMovement.create({
        data: {
          stockItemId: item.id,
          type: 'OUT',
          quantity: dto.quantity,
          reason: dto.reason || 'Transfert inter-dépôts (Sortie)',
          sourceDepotId: dto.sourceDepotId,
          destinationDepotId: dto.destinationDepotId,
        } as any
      });

      await tx.stockMovement.create({
        data: {
          stockItemId: item.id,
          type: 'IN',
          quantity: dto.quantity,
          reason: dto.reason || 'Transfert inter-dépôts (Entrée)',
          sourceDepotId: dto.sourceDepotId,
          destinationDepotId: dto.destinationDepotId,
        } as any
      });

      // Pas de changement sur StockItem.quantity car c'est un transfert interne
      return { message: 'Transfert effectué avec succès.' };
    });
  }

  async recordMovement(id: string, dto: RecordMovementDto) {
    return this.prisma.extended.$transaction(async (tx) => {
      const item = await tx.stockItem.findFirst({
        where: { id },
      });

      if (!item) {
        throw new NotFoundException('Article introuvable dans votre stock.');
      }

      // Si un depotId est spécifié, on gère la balance
      let depotBalance = null;
      if (dto.depotId) {
        depotBalance = await tx.stockBalance.findUnique({
          where: { stockItemId_depotId: { stockItemId: id, depotId: dto.depotId } }
        });
        if (!depotBalance && dto.type !== 'IN' && dto.type !== 'ADJUSTMENT') {
          throw new BadRequestException('Aucun stock dans ce dépôt pour cet article.');
        }
      }

      let newItemQuantity = item.quantity;
      let newBalanceQuantity = depotBalance ? depotBalance.quantity : 0;

      if (dto.type === 'IN') {
        newItemQuantity += dto.quantity;
        newBalanceQuantity += dto.quantity;
      } else if (dto.type === 'OUT') {
        newItemQuantity -= dto.quantity;
        newBalanceQuantity -= dto.quantity;
      } else if (dto.type === 'ADJUSTMENT') {
        const diff = dto.quantity - newBalanceQuantity;
        newItemQuantity += diff;
        newBalanceQuantity = dto.quantity;
      }

      if (newItemQuantity < 0 || (dto.depotId && newBalanceQuantity < 0)) {
        throw new BadRequestException('Stock insuffisant pour cette opération.');
      }

      await tx.stockMovement.create({
        data: {
          stockItemId: id,
          type: dto.type as any,
          quantity: dto.quantity,
          unitPrice: dto.unitPrice || item.sellingPrice,
          reason: dto.reason || 'Mouvement manuel',
          sourceDepotId: dto.type === 'OUT' ? dto.depotId : null,
          destinationDepotId: dto.type === 'IN' ? dto.depotId : null,
        } as any,
      });

      if (dto.depotId) {
        if (depotBalance) {
          await tx.stockBalance.update({
            where: { id: depotBalance.id },
            data: { quantity: newBalanceQuantity }
          });
        } else {
          await tx.stockBalance.create({
            data: {
              stockItemId: id,
              depotId: dto.depotId,
              quantity: newBalanceQuantity
            } as any
          });
        }
      }

      return tx.stockItem.update({
        where: { id },
        data: { quantity: newItemQuantity },
      });
    });
  }

  async recordDirectSale(dto: {
    lines: { stockItemId: string; quantity: number; sellingPrice: number }[];
    clientName?: string;
    clientPhone?: string;
    generateInvoice?: boolean;
    depotId?: string;
  }) {
    const tenantId = TenantContextService.getTenantId();
    if (!tenantId) throw new ForbiddenException('Contexte tenant manquant');

    return this.prisma.extended.$transaction(async (tx) => {
      for (const line of dto.lines) {
        const item = await tx.stockItem.findFirst({ where: { id: line.stockItemId } });
        if (!item) throw new NotFoundException('Article introuvable dans votre stock.');
        
        if (item.quantity < line.quantity) {
          throw new BadRequestException(`Stock global insuffisant pour l'article "${item.name}".`);
        }

        if (dto.depotId) {
          const balance = await tx.stockBalance.findUnique({
            where: { stockItemId_depotId: { stockItemId: item.id, depotId: dto.depotId } }
          });
          if (!balance || balance.quantity < line.quantity) {
             throw new BadRequestException(`Stock insuffisant dans le dépôt sélectionné pour "${item.name}".`);
          }
          await tx.stockBalance.update({
            where: { id: balance.id },
            data: { quantity: balance.quantity - line.quantity }
          });
        }

        await tx.stockMovement.create({
          data: {
            stockItemId: item.id,
            type: 'OUT',
            quantity: line.quantity,
            unitPrice: line.sellingPrice,
            reason: 'Vente comptoir directe (POS)',
            sourceDepotId: dto.depotId,
          } as any
        });

        await tx.stockItem.update({
          where: { id: item.id },
          data: { quantity: item.quantity - line.quantity }
        });
      }

      let invoiceNumber: string | null = null;
      let createdInvoice = null;

      if (dto.generateInvoice) {
        const items = await tx.stockItem.findMany({
          where: { id: { in: dto.lines.map((l) => l.stockItemId) } },
        });
        const itemsById = new Map(items.map((i) => [i.id, i]));

        invoiceNumber = await this.billingSequence.getNextSequenceNumber(
          tenantId,
          BillingDocumentType.INVOICE,
          'FAC',
        );

        const totalAmount = dto.lines.reduce(
          (sum, l) => sum + l.quantity * l.sellingPrice,
          0,
        );

        createdInvoice = await tx.invoice.create({
          data: {
            number: invoiceNumber,
            clientName: dto.clientName || 'Client comptoir',
            clientPhone: dto.clientPhone,
            totalAmount,
            paidAmount: totalAmount,
            status: 'PAID',
            lines: {
              create: dto.lines.map((l) => ({
                description: itemsById.get(l.stockItemId)?.name || 'Article',
                quantity: l.quantity,
                unitPrice: l.sellingPrice,
                vatRate: 0,
                totalPrice: l.quantity * l.sellingPrice,
              })),
            },
          } as any,
          include: { lines: true }
        });
      }

      return {
        message: 'Vente enregistrée et stock décrémenté avec succès.',
        invoiceNumber,
        invoice: createdInvoice,
      };
    });
  }

  async getStockReport() {
    const items = await this.prisma.extended.stockItem.findMany();

    let totalPurchaseValue = 0;
    let totalSellingValue = 0;
    let itemsInAlertCount = 0;

    for (const item of items) {
      totalPurchaseValue += item.quantity * item.purchasePrice;
      totalSellingValue += item.quantity * item.sellingPrice;
      if (item.quantity <= item.alertThreshold) {
        itemsInAlertCount++;
      }
    }

    const potentialMargin = totalSellingValue - totalPurchaseValue;

    return {
      totalItemsCount: items.length,
      totalPurchaseValueXOF: totalPurchaseValue,
      totalSellingValueXOF: totalSellingValue,
      potentialMarginXOF: potentialMargin,
      itemsInAlertCount,
    };
  }

  async getMovementsHistory() {
    return this.prisma.extended.stockMovement.findMany({
      include: { stockItem: true, sourceDepot: true, destinationDepot: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
