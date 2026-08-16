import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInventorySessionDto, UpdateInventoryLineDto } from './dto/inventory.dto';

@Injectable()
export class QuincaillerieInventoryService {
  constructor(private prisma: PrismaService) {}

  async createSession(dto: CreateInventorySessionDto) {
    const stockItems = await this.prisma.extended.stockItem.findMany();

    return this.prisma.extended.inventorySession.create({
      data: {
        label: dto.label,
        periodType: dto.periodType,
        periodStart: dto.periodStart ? new Date(dto.periodStart) : null,
        periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : null,
        lines: {
          create: stockItems.map((item) => ({
            stockItemId: item.id,
            systemQuantity: item.quantity,
            unitCost: item.purchasePrice,
          })),
        },
      } as any,
      include: { lines: { include: { stockItem: true } } },
    });
  }

  async findAllSessions(filters: { periodType?: string; dateFrom?: string; dateTo?: string }) {
    const where: any = {};
    if (filters.periodType) where.periodType = filters.periodType;
    if (filters.dateFrom || filters.dateTo) {
      where.startedAt = {};
      if (filters.dateFrom) where.startedAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.startedAt.lte = new Date(filters.dateTo);
    }

    return this.prisma.extended.inventorySession.findMany({
      where,
      orderBy: { startedAt: 'desc' },
    });
  }

  async findSession(id: string) {
    const session = await this.prisma.extended.inventorySession.findFirst({
      where: { id },
      include: { lines: { include: { stockItem: true } } },
    });
    if (!session) throw new NotFoundException("Session d'inventaire introuvable.");
    return session;
  }

  async updateLine(sessionId: string, lineId: string, dto: UpdateInventoryLineDto) {
    const session = await this.prisma.extended.inventorySession.findFirst({ where: { id: sessionId } });
    if (!session) throw new NotFoundException("Session d'inventaire introuvable.");
    if (session.status !== 'DRAFT') {
      throw new BadRequestException("Cette session d'inventaire est déjà terminée.");
    }

    const line = await this.prisma.extended.inventorySessionLine.findFirst({
      where: { id: lineId, inventorySessionId: sessionId },
    });
    if (!line) throw new NotFoundException("Ligne d'inventaire introuvable.");

    return this.prisma.extended.inventorySessionLine.update({
      where: { id: lineId },
      data: {
        countedQuantity: dto.countedQuantity,
        discrepancy: dto.countedQuantity - line.systemQuantity,
        notes: dto.notes,
      },
    });
  }

  async completeSession(id: string) {
    const session = await this.prisma.extended.inventorySession.findFirst({
      where: { id },
      include: { lines: true },
    });
    if (!session) throw new NotFoundException("Session d'inventaire introuvable.");
    if (session.status !== 'DRAFT') {
      throw new BadRequestException('Cette session est déjà terminée.');
    }

    const uncounted = session.lines.filter(l => l.countedQuantity === null).length;
    if (uncounted > 0) {
      throw new BadRequestException(`Il reste ${uncounted} ligne(s) non comptée(s). Veuillez toutes les vérifier avant de clôturer.`);
    }

    return this.prisma.extended.inventorySession.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: { lines: { include: { stockItem: true } } },
    });
  }

  async applyAdjustments(id: string) {
    const session = await this.prisma.extended.inventorySession.findFirst({
      where: { id },
      include: { lines: true },
    });
    if (!session) throw new NotFoundException("Session d'inventaire introuvable.");
    if (session.status !== 'COMPLETED') throw new BadRequestException("La session doit être terminée (COMPLETED) avant d'appliquer les ajustements.");
    if (session.adjusted) throw new BadRequestException('Les ajustements de cette session ont déjà été appliqués.');

    for (const line of session.lines) {
      if (line.discrepancy !== 0 && line.countedQuantity !== null) {
        await this.prisma.extended.stockMovement.create({
          data: {
            tenantId: session.tenantId,
            stockItemId: line.stockItemId,
            type: 'ADJUSTMENT',
            quantity: line.discrepancy,
            unitPrice: line.unitCost,
            reason: `Inventaire de clôture : ${session.label}`,
          }
        });
        
        await this.prisma.extended.stockItem.update({
          where: { id: line.stockItemId },
          data: { quantity: line.countedQuantity }
        });
      }
    }

    return this.prisma.extended.inventorySession.update({
      where: { id },
      data: { adjusted: true },
      include: { lines: { include: { stockItem: true } } },
    });
  }
}
