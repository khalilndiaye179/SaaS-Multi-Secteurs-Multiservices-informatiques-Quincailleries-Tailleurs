import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServicePackageDto, UpdateServicePackageDto } from './dto/service-package.dto';

@Injectable()
export class ITServicePackageService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.extended.iTServicePackage.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const pkg = await this.prisma.extended.iTServicePackage.findFirst({
      where: { id },
    });
    if (!pkg) {
      throw new NotFoundException('Forfait de prestation introuvable.');
    }
    return pkg;
  }

  async create(dto: CreateServicePackageDto) {
    return this.prisma.extended.iTServicePackage.create({
      data: { ...dto } as any,
    });
  }

  async update(id: string, dto: UpdateServicePackageDto) {
    await this.findOne(id);
    return this.prisma.extended.iTServicePackage.update({
      where: { id },
      data: { ...dto } as any,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.extended.iTServicePackage.delete({ where: { id } });
    return { message: 'Forfait supprimé du catalogue.' };
  }
}


