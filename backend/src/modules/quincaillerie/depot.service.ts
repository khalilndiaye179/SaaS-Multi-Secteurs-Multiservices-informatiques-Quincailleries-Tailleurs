import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepotDto, UpdateDepotDto } from './dto/depot.dto';

@Injectable()
export class DepotService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.extended.depot.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(dto: CreateDepotDto) {
    if (dto.isMain) {
      await this.prisma.extended.depot.updateMany({
        where: { isMain: true },
        data: { isMain: false } as any
      });
    }

    return this.prisma.extended.depot.create({
      data: dto as any,
    });
  }

  async update(id: string, dto: UpdateDepotDto) {
    if (dto.isMain) {
      await this.prisma.extended.depot.updateMany({
        where: { isMain: true },
        data: { isMain: false } as any
      });
    }

    return this.prisma.extended.depot.update({
      where: { id },
      data: dto as any,
    });
  }

  async remove(id: string) {
    return this.prisma.extended.depot.delete({
      where: { id },
    });
  }
}
