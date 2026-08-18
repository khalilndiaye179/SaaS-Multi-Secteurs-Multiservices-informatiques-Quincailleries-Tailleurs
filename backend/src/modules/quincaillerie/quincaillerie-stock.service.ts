import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStockItemDto, UpdateStockItemDto, RecordMovementDto } from './dto/stock.dto';
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
      orderBy: { name: 'asc' },
    });
  }

  async findAlerts() {
    const items = await this.prisma.extended.stockItem.findMany();
    return items.filter((item) => item.quantity <= item.alertThreshold);
  }

  async create(dto: CreateStockItemDto) {
    return this.prisma.extended.stockItem.create({
      data: dto as any,
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

  async recordMovement(id: string, dto: RecordMovementDto) {
    const item = await this.prisma.extended.stockItem.findFirst({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Article introuvable dans votre stock.');
    }

    let newQuantity = item.quantity;
    if (dto.type === 'IN') {
      newQuantity += dto.quantity;
    } else if (dto.type === 'OUT') {
      newQuantity -= dto.quantity;
    } else if (dto.type === 'ADJUSTMENT') {
      newQuantity = dto.quantity;
    }

    if (newQuantity < 0) {
      throw new BadRequestException('Stock insuffisant pour cette opération.');
    }

    await this.prisma.extended.stockMovement.create({
      data: {
        stockItemId: id,
        type: dto.type as any,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice || item.sellingPrice,
        reason: dto.reason || 'Mouvement manuel',
      } as any,
    });

    return this.prisma.extended.stockItem.update({
      where: { id },
      data: { quantity: newQuantity },
    });
  }

  async recordDirectSale(dto: {
    lines: { stockItemId: string; quantity: number; sellingPrice: number }[];
    clientName?: string;
    clientPhone?: string;
    generateInvoice?: boolean;
  }) {
    const tenantId = TenantContextService.getTenantId();
    if (!tenantId) throw new ForbiddenException('Contexte tenant manquant');

    return this.prisma.extended.$transaction(async (tx) => {
      for (const line of dto.lines) {
        const item = await tx.stockItem.findFirst({ where: { id: line.stockItemId } });
        if (!item) throw new NotFoundException('Article introuvable dans votre stock.');
        
        if (item.quantity < line.quantity) {
          throw new BadRequestException(`Stock insuffisant pour l'article "${item.name}".`);
        }

        await tx.stockMovement.create({
          data: {
            stockItemId: item.id,
            type: 'OUT',
            quantity: line.quantity,
            unitPrice: line.sellingPrice,
            reason: 'Vente comptoir directe',
          } as any
        });

        await tx.stockItem.update({
          where: { id: item.id },
          data: { quantity: item.quantity - line.quantity }
        });
      }

      let invoiceNumber: string | null = null;

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

        await tx.invoice.create({
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
        });
      }

      return {
        message: 'Vente enregistrée et stock décrémenté avec succès.',
        invoiceNumber,
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
      include: { stockItem: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}


