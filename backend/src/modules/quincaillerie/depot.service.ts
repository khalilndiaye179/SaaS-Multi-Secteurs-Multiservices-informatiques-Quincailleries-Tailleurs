import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepotDto, UpdateDepotDto } from './dto/depot.dto';

@Injectable()
export class DepotService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.extended.depot.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(tenantId: string, dto: CreateDepotDto) {
    if (dto.isMain) {
      await this.prisma.extended.depot.updateMany({
        where: { isMain: true, tenantId },
        data: { isMain: false } as any
      });
    }

    return this.prisma.extended.depot.create({
      data: { ...dto, tenantId } as any,
    });
  }

  async update(tenantId: string, id: string, dto: UpdateDepotDto) {
    const existing = await this.prisma.extended.depot.findFirst({
      where: { id, tenantId }
    });
    if (!existing) {
      throw new NotFoundException('Dépôt introuvable');
    }

    if (dto.isMain) {
      await this.prisma.extended.depot.updateMany({
        where: { isMain: true, tenantId },
        data: { isMain: false } as any
      });
    }

    return this.prisma.extended.depot.update({
      where: { id },
      data: dto as any,
    });
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.extended.depot.findFirst({
      where: { id, tenantId }
    });
    if (!existing) {
      throw new NotFoundException('Dépôt introuvable');
    }

    return this.prisma.extended.depot.delete({
      where: { id },
    });
  }
}
