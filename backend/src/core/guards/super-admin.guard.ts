import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { TenantContextService } from '../tenant/tenant-context.service';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const store = TenantContextService.getStore();

    if (!store || !store.userId) {
      throw new UnauthorizedException('Accès refusé : Contexte utilisateur manquant.');
    }

    if (!store.isSuperAdmin && !store.roles?.includes('SUPER_ADMIN')) {
      throw new ForbiddenException(
        'Accès refusé : Réservé exclusivement à l\'Administrateur de la Plateforme (Super Admin).',
      );
    }

    return true;
  }
}
