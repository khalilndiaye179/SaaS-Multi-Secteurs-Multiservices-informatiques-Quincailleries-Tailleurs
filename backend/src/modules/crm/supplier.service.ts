import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    return this.prisma.extended.supplier.create({
      data: {
        tenantId,
        ...data,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.extended.supplier.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const supplier = await this.prisma.extended.supplier.findFirst({
      where: { id, tenantId },
    });
    if (!supplier) throw new NotFoundException('Fournisseur introuvable');
    return supplier;
  }

  async update(tenantId: string, id: string, data: any) {
    const existing = await this.prisma.extended.supplier.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Fournisseur introuvable');
    }

    const updated = await this.prisma.extended.supplier.updateMany({
      where: { id, tenantId },
      data,
    });
    
    if (updated.count === 0) {
      throw new NotFoundException('Fournisseur introuvable');
    }

    return this.prisma.extended.supplier.findUnique({ where: { id } });
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.extended.supplier.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Fournisseur introuvable');
    }

    const deleted = await this.prisma.extended.supplier.deleteMany({
      where: { id, tenantId },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('Fournisseur introuvable');
    }
    return { success: true };
  }
}
