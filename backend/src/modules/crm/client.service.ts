import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    return this.prisma.extended.client.create({
      data: {
        tenantId,
        ...data,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.extended.client.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const client = await this.prisma.extended.client.findFirst({
      where: { id, tenantId },
    });
    if (!client) throw new NotFoundException('Client introuvable');
    return client;
  }

  async update(tenantId: string, id: string, data: any) {
    const existing = await this.prisma.extended.client.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Client introuvable');
    }

    const updated = await this.prisma.extended.client.updateMany({
      where: { id, tenantId },
      data,
    });
    
    if (updated.count === 0) {
      throw new NotFoundException('Client introuvable');
    }

    return this.prisma.extended.client.findUnique({ where: { id } });
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.extended.client.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Client introuvable');
    }

    const deleted = await this.prisma.extended.client.deleteMany({
      where: { id, tenantId },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('Client introuvable');
    }
    return { success: true };
  }
}
