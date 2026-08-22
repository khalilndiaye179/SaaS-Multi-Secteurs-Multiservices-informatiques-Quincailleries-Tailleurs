import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTicketDto, UpdateTicketStatusDto, ConvertToStockDto } from './dto/ticket.dto';
import { SmsProviderService } from '../sms-provider/sms-provider.service';

@Injectable()
export class ITMultiservicesTicketService {
  constructor(
    private prisma: PrismaService,
    private smsService: SmsProviderService,
  ) {}

  async findAll() {
    return this.prisma.extended.repairTicket.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const ticket = await this.prisma.extended.repairTicket.findFirst({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket de réparation introuvable.');
    }
    return ticket;
  }

  async create(dto: CreateTicketDto) {
    const year = new Date().getFullYear();
    const count = await this.prisma.extended.repairTicket.count();
    const ticketNumber = `TCK-${year}-${(count + 1).toString().padStart(4, '0')}`;

    return this.prisma.extended.repairTicket.create({
      data: {
        ...dto,
        ticketNumber,
        status: 'RECEIVED',
      } as any,
    });
  }

  async updateStatus(id: string, dto: UpdateTicketStatusDto) {
    const ticket = await this.prisma.extended.repairTicket.findFirst({
      where: { id },
      include: { usedParts: true }
    });

    if (!ticket) {
      throw new NotFoundException('Ticket de réparation introuvable.');
    }

    const updatedTicket = await this.prisma.extended.$transaction(async (tx) => {
      if (dto.usedParts && dto.usedParts.length > 0 && ['READY', 'DELIVERED'].includes(dto.status)) {
        if (ticket.usedParts.length > 0) {
          throw new BadRequestException("Des pièces ont déjà été déduites pour ce ticket.");
        }

        for (const part of dto.usedParts) {
          const stockItem = await tx.stockItem.findUnique({ where: { id: part.stockItemId }});
          if (!stockItem) throw new NotFoundException(`Article de stock ${part.stockItemId} introuvable`);
          if (stockItem.quantity < part.quantity) {
            throw new BadRequestException(`Stock insuffisant pour ${stockItem.name} (Dispo: ${stockItem.quantity})`);
          }

          await tx.stockItem.update({
            where: { id: part.stockItemId },
            data: { quantity: { decrement: part.quantity } }
          });

          await tx.stockMovement.create({
            data: {
              tenantId: ticket.tenantId,
              stockItemId: part.stockItemId,
              type: 'OUT',
              quantity: part.quantity,
              unitPrice: stockItem.purchasePrice,
              reason: `Réparation IT - Ticket ${ticket.ticketNumber}`,
            }
          });

          await tx.repairTicketPart.create({
            data: {
              repairTicketId: ticket.id,
              stockItemId: part.stockItemId,
              quantity: part.quantity,
            }
          });
        }
      }

      return tx.repairTicket.update({
        where: { id },
        data: {
          status: dto.status,
          estimatedCost: dto.estimatedCost !== undefined ? dto.estimatedCost : ticket.estimatedCost,
          finalCost: dto.finalCost !== undefined ? dto.finalCost : ticket.finalCost,
          notes: dto.notes !== undefined ? dto.notes : ticket.notes,
          photoBefore: dto.photoBefore !== undefined ? dto.photoBefore : ticket.photoBefore,
          photoAfter: dto.photoAfter !== undefined ? dto.photoAfter : ticket.photoAfter,
        },
      });
    });

    // Envoi du SMS si le statut passe à READY (et n'y était pas déjà)
    if (dto.status === 'READY' && ticket.status !== 'READY') {
      try {
        const message = `Bonjour ${ticket.clientName}, votre appareil (${ticket.deviceModel}) est réparé et prêt à être récupéré ! (Ticket: ${ticket.ticketNumber})`;
        this.smsService.sendNotification(ticket.clientPhone, message).catch((err) => {
          console.error("Erreur lors de l'envoi du SMS de notification (background):", err);
        });
      } catch (e) {
        console.error("Erreur lors de la préparation du SMS de notification:", e);
      }
    }

    return updatedTicket;
  }

  async getStats() {
    const tickets = await this.prisma.extended.repairTicket.findMany();

    let activeInWorkshopCount = 0;
    let readyForPickupCount = 0;
    let totalRevenueXOF = 0;

    for (const t of tickets) {
      if (['RECEIVED', 'DIAGNOSIS', 'IN_REPAIR'].includes(t.status)) {
        activeInWorkshopCount++;
      } else if (t.status === 'READY') {
        readyForPickupCount++;
      } else if (t.status === 'DELIVERED') {
        totalRevenueXOF += t.finalCost || t.estimatedCost || 0;
      }
    }

    return {
      totalTicketsCount: tickets.length,
      activeInWorkshopCount,
      readyForPickupCount,
      totalRevenueXOF,
    };
  }
  async convertToStock(id: string, dto: ConvertToStockDto) {
    const ticket = await this.prisma.extended.repairTicket.findFirst({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket de réparation introuvable.');
    }

    if (ticket.status !== 'IMPOSSIBLE') {
      throw new BadRequestException("Seul un ticket marqué IMPOSSIBLE peut être converti en stock.");
    }

    return this.prisma.extended.$transaction(async (tx) => {
      const updatedTicket = await tx.repairTicket.update({
        where: { id },
        data: {
          status: 'CONVERTED_TO_STOCK',
          finalCost: dto.purchasePrice,
        },
      });

      const stockItem = await tx.stockItem.create({
        data: {
          tenantId: ticket.tenantId,
          name: `[Reconditionné] ${ticket.deviceModel}`,
          sku: dto.sku,
          purchasePrice: dto.purchasePrice,
          sellingPrice: dto.sellingPrice,
          quantity: 1,
          alertThreshold: 0,
          unit: dto.unit,
        },
      });

      await tx.stockMovement.create({
        data: {
          tenantId: ticket.tenantId,
          stockItemId: stockItem.id,
          type: 'IN',
          quantity: 1,
          unitPrice: dto.purchasePrice,
          reason: `Conversion depuis Réparation (Ticket: ${ticket.ticketNumber})`,
        },
      });

      return { ticket: updatedTicket, stockItem };
    });
  }
}


