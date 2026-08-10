import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTicketDto, UpdateTicketStatusDto } from './dto/ticket.dto';

@Injectable()
export class ITMultiservicesTicketService {
  constructor(private prisma: PrismaService) {}

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
    });

    if (!ticket) {
      throw new NotFoundException('Ticket de réparation introuvable.');
    }

    return this.prisma.extended.repairTicket.update({
      where: { id },
      data: {
        status: dto.status,
        estimatedCost: dto.estimatedCost !== undefined ? dto.estimatedCost : ticket.estimatedCost,
        finalCost: dto.finalCost !== undefined ? dto.finalCost : ticket.finalCost,
        notes: dto.notes !== undefined ? dto.notes : ticket.notes,
      },
    });
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
}


