import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    return this.prisma.supplier.create({
      data: {
        tenantId,
        ...data,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.supplier.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, tenantId },
    });
    if (!supplier) throw new NotFoundException('Fournisseur introuvable');
    return supplier;
  }

  async update(tenantId: string, id: string, data: any) {
    await this.findOne(tenantId, id); // check exist
    return this.prisma.supplier.update({
      where: { id },
      data,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id); // check exist
    return this.prisma.supplier.delete({
      where: { id },
    });
  }
}
