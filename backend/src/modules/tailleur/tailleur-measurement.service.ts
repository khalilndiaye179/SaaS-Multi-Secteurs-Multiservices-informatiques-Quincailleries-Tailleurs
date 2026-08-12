import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMeasurementDto, UpdateMeasurementDto, CreateTailleurOrderDto, UpdateTailleurOrderStatusDto } from './dto/measurement.dto';

@Injectable()
export class TailleurMeasurementService {
  constructor(private prisma: PrismaService) {}

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

    const year = new Date().getFullYear();
    const count = await this.prisma.extended.tailleurOrder.count();
    const orderNumber = `CMD-${year}-${(count + 1).toString().padStart(4, '0')}`;

    return this.prisma.extended.tailleurOrder.create({
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
        status: 'ORDERED',
      } as any,
    });
  }

  async findAllOrders() {
    return this.prisma.extended.tailleurOrder.findMany({
      include: { measurement: true },
      orderBy: { createdAt: 'desc' },
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
}


