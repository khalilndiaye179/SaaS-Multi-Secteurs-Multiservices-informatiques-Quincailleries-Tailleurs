import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { SectorType } from '../types/tenant.types';
import { SECTOR_KEY } from '../tenant/sector.decorator';
import { TenantContextService } from '../tenant/tenant-context.service';


@Injectable()
export class SectorPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredSectors = this.reflector.getAllAndOverride<SectorType[]>(SECTOR_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredSectors) {
      return true; // Route ouverte ou générique
    }

    const store = TenantContextService.getStore();
    const user = store ? { tenantId: store.tenantId, sectorType: store.sectorType } : null;

    if (!user || !user.tenantId || !user.sectorType) {
      throw new UnauthorizedException('Accès refusé : Contexte utilisateur ou tenant manquant dans le JWT.');
    }


    // 1. Vérification au niveau du claim JWT
    const jwtSector = user.sectorType as SectorType;
    if (!requiredSectors.includes(jwtSector)) {
      throw new ForbiddenException(
        `Accès refusé (JWT) : Le secteur ${jwtSector} n'est pas autorisé sur cette route.`,
      );
    }

    // 2. DOUBLE-VÉRIFICATION ANTI-USURPATION (Vérification directe en BDD)
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { sectorType: true, billingStatus: true },
    });

    if (!tenant) {
      throw new UnauthorizedException('Tenant introuvable en base de données.');
    }

    if (tenant.sectorType !== jwtSector) {
      throw new ForbiddenException(
        `Alerte Sécurité : Le secteur du token (${jwtSector}) ne correspond pas au secteur réel du tenant en BDD (${tenant.sectorType}).`,
      );
    }

    return true;
  }
}
