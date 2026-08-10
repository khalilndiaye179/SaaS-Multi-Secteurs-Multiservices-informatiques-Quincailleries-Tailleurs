import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStockItemDto, UpdateStockItemDto, RecordMovementDto } from './dto/stock.dto';

@Injectable()
export class QuincaillerieStockService {
  constructor(private prisma: PrismaService) {}

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

  async recordDirectSale(lines: { stockItemId: string; quantity: number; sellingPrice: number }[]) {
    return this.prisma.$transaction(async () => {
      for (const line of lines) {
        await this.recordMovement(line.stockItemId, {
          type: 'OUT' as any,
          quantity: line.quantity,
          unitPrice: line.sellingPrice,
          reason: 'Vente comptoir directe',
        });
      }
      return { message: 'Vente enregistrée et stock décrémenté avec succès.' };
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


