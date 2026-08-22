import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './dto/purchase-order.dto';
import { PurchaseOrderStatus } from '@prisma/client';

@Injectable()
export class QuincailleriePurchaseService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.extended.purchaseOrder.findMany({
      include: { stockItem: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.extended.purchaseOrder.findFirst({
      where: { id },
      include: { stockItem: true },
    });
    if (!order) throw new NotFoundException('Commande fournisseur introuvable.');
    return order;
  }

  async create(dto: CreatePurchaseOrderDto) {
    return this.prisma.extended.purchaseOrder.create({
      data: {
        supplierName: dto.supplierName,
        itemDescription: dto.itemDescription,
        stockItemId: dto.stockItemId || null,
        qtyOrdered: dto.qtyOrdered,
        totalCostXOF: dto.totalCostXOF,
        status: dto.status || PurchaseOrderStatus.PENDING,
        notes: dto.notes || null,
      } as any,
      include: { stockItem: true },
    });
  }

  async update(id: string, dto: UpdatePurchaseOrderDto) {
    const order = await this.findOne(id);
    return this.prisma.extended.purchaseOrder.update({
      where: { id },
      data: dto as any,
      include: { stockItem: true },
    });
  }

  async markAsReceived(id: string) {
    const order = await this.findOne(id);
    if (order.status === PurchaseOrderStatus.RECEIVED) {
      throw new BadRequestException('Cette commande a déjà été marquée comme réceptionnée.');
    }

    return this.prisma.$transaction(async () => {
      // 1. Mettre à jour le statut de la commande
      const updatedOrder = await this.prisma.extended.purchaseOrder.update({
        where: { id },
        data: {
          status: PurchaseOrderStatus.RECEIVED,
          receivedDate: new Date(),
        },
        include: { stockItem: true },
      });

      // 2. Si un article du stock est lié, incrémenter le stock et créer un mouvement d'entrée
      if (order.stockItemId) {
        const item = await this.prisma.extended.stockItem.findFirst({
          where: { id: order.stockItemId },
        });

        if (item) {
          const unitPrice = order.qtyOrdered > 0 ? order.totalCostXOF / order.qtyOrdered : item.purchasePrice;

          await this.prisma.extended.stockMovement.create({
            data: {
              stockItemId: item.id,
              type: 'IN',
              quantity: order.qtyOrdered,
              unitPrice: unitPrice,
              reason: `Réception Commande Fournisseur #${order.id.slice(0, 8)} (${order.supplierName})`,
            } as any,
          });

          await this.prisma.extended.stockItem.update({
            where: { id: item.id },
            data: {
              quantity: item.quantity + order.qtyOrdered,
            },
          });
        }
      }

      return updatedOrder;
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.extended.purchaseOrder.delete({
      where: { id },
    });
  }
}
