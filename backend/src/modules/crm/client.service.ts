import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    return this.prisma.client.create({
      data: {
        tenantId,
        ...data,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.client.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
    });
    if (!client) throw new NotFoundException('Client introuvable');
    return client;
  }

  async update(tenantId: string, id: string, data: any) {
    await this.findOne(tenantId, id); // check exist
    return this.prisma.client.update({
      where: { id },
      data,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id); // check exist
    return this.prisma.client.delete({
      where: { id },
    });
  }
}
