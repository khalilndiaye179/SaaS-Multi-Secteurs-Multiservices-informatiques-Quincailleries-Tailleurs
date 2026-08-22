import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMeasurementDto, UpdateMeasurementDto, CreateTailleurOrderDto, UpdateTailleurOrderStatusDto } from './dto/measurement.dto';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { BillingSequenceService } from '../billing/billing-sequence.service';
import { BillingDocumentType } from '@prisma/client';

@Injectable()
export class TailleurMeasurementService {
  constructor(
    private prisma: PrismaService,
    private billingSequence: BillingSequenceService,
  ) {}

  async findAll() {
    return this.prisma.extended.clientMeasurement.findMany({
      where: { parentMeasurementId: null },
      include: { members: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMembers(parentId: string) {
    const parent = await this.prisma.extended.clientMeasurement.findFirst({
      where: { id: parentId },
    });

    if (!parent) {
      throw new NotFoundException('Fiche parent introuvable.');
    }

    return this.prisma.extended.clientMeasurement.findMany({
      where: { parentMeasurementId: parentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const measurement = await this.prisma.extended.clientMeasurement.findFirst({
      where: { id },
    });

    if (!measurement) {
      throw new NotFoundException('Fiche de mesures introuvable.');
    }
    return measurement;
  }

  async create(dto: CreateMeasurementDto) {
    if (dto.parentMeasurementId) {
      const parent = await this.prisma.extended.clientMeasurement.findFirst({
        where: { id: dto.parentMeasurementId },
      });

      if (!parent) {
        throw new NotFoundException('Fiche parent introuvable.');
      }

      if (parent.parentMeasurementId !== null) {
        throw new BadRequestException(
          'Impossible de rattacher un membre à une fiche qui est elle-même un membre. Seule une fiche tuteur (racine) peut avoir des membres rattachés.',
        );
      }
    }

    return this.prisma.extended.clientMeasurement.create({
      data: {
        clientName: dto.clientName,
        clientPhone: dto.clientPhone,
        beneficiaryName: dto.beneficiaryName,
        garmentType: dto.garmentType,
        parentMeasurementId: dto.parentMeasurementId || null,
        measurements: dto.measurements,
        notes: dto.notes,
      } as any,
    });
  }


  async update(id: string, dto: UpdateMeasurementDto) {
    const measurement = await this.prisma.extended.clientMeasurement.findFirst({
      where: { id },
    });

    if (!measurement) {
      throw new NotFoundException('Fiche de mesures introuvable.');
    }

    return this.prisma.extended.clientMeasurement.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  async remove(id: string) {
    const measurement = await this.prisma.extended.clientMeasurement.findFirst({
      where: { id },
    });

    if (!measurement) {
      throw new NotFoundException('Fiche de mesures introuvable.');
    }

    return this.prisma.extended.clientMeasurement.delete({
      where: { id },
    });
  }


  async createOrder(dto: CreateTailleurOrderDto) {
    const tenantId = TenantContextService.getTenantId();
    if (!tenantId) throw new ForbiddenException('Contexte tenant manquant');

    const year = new Date().getFullYear();
    const count = await this.prisma.extended.tailleurOrder.count();
    const orderNumber = `CMD-${year}-${(count + 1).toString().padStart(4, '0')}`;

    const invoiceNumber = await this.billingSequence.getNextSequenceNumber(
      tenantId,
      BillingDocumentType.INVOICE,
      'FAC',
    );

    const itemsCreateData = dto.items && dto.items.length > 0
      ? {
          create: dto.items.map((it) => ({
            garmentType: it.garmentType,
            unitPrice: it.unitPrice || 0,
            quantity: it.quantity || 1,
            notes: it.notes || null,
          })),
        }
      : undefined;

    return this.prisma.extended.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          number: invoiceNumber,
          clientName: dto.clientName,
          clientPhone: dto.clientPhone,
          totalAmount: dto.totalPrice,
          paidAmount: dto.advancePaid || 0,
          status: 'DRAFT',
          lines: {
            create: [
              {
                description: dto.garmentType,
                quantity: 1,
                unitPrice: dto.totalPrice,
                vatRate: 0,
                totalPrice: dto.totalPrice,
              },
            ],
          },
        } as any,
      });

      return tx.tailleurOrder.create({
        data: {
          orderNumber,
          clientName: dto.clientName,
          clientPhone: dto.clientPhone,
          garmentType: dto.garmentType,
          fabricDesc: dto.fabricDesc,
          fittingDate: dto.fittingDate ? new Date(dto.fittingDate) : null,
          deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
          totalPrice: dto.totalPrice,
          advancePaid: dto.advancePaid || 0,
          measurementsId: dto.measurementsId || null,
          fabricProvided: dto.fabricProvided || false,
          fabricMeters: dto.fabricMeters || null,
          assigneeId: dto.assigneeId || null,
          invoiceId: invoice.id,
          status: 'ORDERED',
          ...(itemsCreateData ? { items: itemsCreateData } : {}),
        } as any,
        include: { items: true, measurement: true, invoice: true, assignee: { select: { id: true, fullName: true } } },
      });
    });
  }

  async registerPayment(orderId: string, amount: number) {
    const order = await this.prisma.extended.tailleurOrder.findFirst({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Commande introuvable.');

    const newAdvancePaid = order.advancePaid + amount;
    if (newAdvancePaid > order.totalPrice) {
      throw new BadRequestException(
        `Le paiement dépasse le solde restant (${order.totalPrice - order.advancePaid} XOF).`,
      );
    }

    return this.prisma.extended.$transaction(async (tx) => {
      const updatedOrder = await tx.tailleurOrder.update({
        where: { id: orderId },
        data: { advancePaid: newAdvancePaid },
        include: { items: true, measurement: true, invoice: true },
      });

      if (order.invoiceId) {
        await tx.invoice.update({
          where: { id: order.invoiceId },
          data: { paidAmount: { increment: amount } },
        });
      }

      return updatedOrder;
    });
  }

  async migrateOrphanOrders() {
    const orphanOrders = await this.prisma.withoutTenantScope((client) =>
      client.tailleurOrder.findMany({
        where: { invoiceId: null },
        include: { tenant: true },
      }),
    );

    let migratedCount = 0;
    const errors: string[] = [];

    for (const order of orphanOrders) {
      try {
        const invoiceNumber = await this.billingSequence.getNextSequenceNumber(
          order.tenantId,
          BillingDocumentType.INVOICE,
          'FAC',
        );

        await this.prisma.withoutTenantScope(async (client) => {
          const invoice = await client.invoice.create({
            data: {
              tenant: { connect: { id: order.tenantId } },
              number: invoiceNumber,
              clientName: order.clientName,
              clientPhone: order.clientPhone,
              totalAmount: order.totalPrice,
              paidAmount: order.advancePaid,
              status: 'DRAFT',
              lines: {
                create: [
                  {
                    description: order.garmentType,
                    quantity: 1,
                    unitPrice: order.totalPrice,
                    vatRate: 0,
                    totalPrice: order.totalPrice,
                  },
                ],
              },
            } as any,
          });

          await client.tailleurOrder.update({
            where: { id: order.id },
            data: { invoiceId: invoice.id },
          });
        });

        migratedCount++;
      } catch (e) {
        errors.push(`Commande ${order.orderNumber}: ${e.message}`);
      }
    }

    return { totalOrphans: orphanOrders.length, migratedCount, errors };
  }


  async findAllOrders() {
    return this.prisma.extended.tailleurOrder.findMany({
      include: { 
        items: true, 
        measurement: true,
        assignee: { select: { id: true, fullName: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllCatalogItems() {
    return this.prisma.extended.tailleurCatalogItem.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCatalogItem(dto: any) {
    return this.prisma.extended.tailleurCatalogItem.create({
      data: {
        name: dto.name,
        category: dto.category || 'Traditionnel',
        estimatedPrice: dto.estimatedPrice || 0,
        delaysDays: dto.delaysDays || 5,
        description: dto.description || null,
        fabricRecommendation: dto.fabricRecommendation || null,
      } as any,
    });
  }

  async updateOrderStatus(id: string, dto: UpdateTailleurOrderStatusDto) {
    const order = await this.prisma.extended.tailleurOrder.findFirst({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Commande de couture introuvable.');
    }

    const updateData: any = {
      status: dto.status as any,
      advancePaid: dto.advancePaid !== undefined ? dto.advancePaid : order.advancePaid,
    };

    if (dto.cancellationReason) {
      updateData.fabricDesc = order.fabricDesc
        ? `${order.fabricDesc} [ANNULÉE : ${dto.cancellationReason}]`
        : `[ANNULÉE : ${dto.cancellationReason}]`;
    }

    return this.prisma.extended.tailleurOrder.update({
      where: { id },
      data: updateData,
    });
  }

  async updateOrder(id: string, dto: any) {
    const order = await this.prisma.extended.tailleurOrder.findFirst({ where: { id } });
    if (!order) throw new NotFoundException('Commande introuvable.');
    return this.prisma.extended.tailleurOrder.update({
      where: { id },
      data: dto,
    });
  }

  async removeOrder(id: string) {
    const order = await this.prisma.extended.tailleurOrder.findFirst({ where: { id } });
    if (!order) throw new NotFoundException('Commande introuvable.');
    return this.prisma.extended.tailleurOrder.delete({ where: { id } });
  }


  async getTailleurStats() {
    const orders = await this.prisma.extended.tailleurOrder.findMany();

    let inConfectionCount = 0;
    let totalAdvancesXOF = 0;
    let totalPendingBalanceXOF = 0;

    for (const o of orders) {
      if (['ORDERED', 'CUTTING', 'SEWING', 'FITTING'].includes(o.status)) {
        inConfectionCount++;
      }
      totalAdvancesXOF += o.advancePaid;
      const remaining = o.totalPrice - o.advancePaid;
      if (remaining > 0 && o.status !== 'DELIVERED') {
        totalPendingBalanceXOF += remaining;
      }
    }

    return {
      totalOrdersCount: orders.length,
      inConfectionCount,
      totalAdvancesXOF,
      totalPendingBalanceXOF,
    };
  }

  async getCollaborators() {
    return this.prisma.extended.user.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true, username: true },
      orderBy: { fullName: 'asc' },
    });
  }
}


