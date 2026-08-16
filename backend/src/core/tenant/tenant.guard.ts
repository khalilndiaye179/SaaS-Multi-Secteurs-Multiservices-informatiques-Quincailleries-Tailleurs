import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../auth/public.decorator';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const store = TenantContextService.getStore();

    if (!store) {
      throw new ForbiddenException(
        'SECURITY ERROR: Context missing. Request execution denied.',
      );
    }

    // Le SuperAdmin et le contexte système ont accès global
    if (store.isSuperAdmin || store.isSystemContext) {
      return true;
    }

    // Pour les requêtes utilisateur normales, tenantId est OBLIGATOIRE
    if (!store.tenantId) {
      throw new ForbiddenException(
        'SECURITY ERROR: Tenant ID unresolved. Access denied.',
      );
    }

    // VÉRIFICATION DYNAMIQUE À CHAQUE REQUÊTE : Bloquer immédiatement si le tenant est ARCHIVED ou SUSPENDED
    const tenantStatus = store.billingStatus;
    if (tenantStatus === 'ARCHIVED') {
      throw new ForbiddenException(
        'SECURITY ERROR (SOFT DELETE): Ce compte d\'entreprise a été archivé par l\'administration. Accès immédiatement révoqué.',
      );
    }

    if (tenantStatus === 'SUSPENDED') {
      throw new ForbiddenException(
        'SECURITY ERROR: Ce compte d\'entreprise est actuellement suspendu. Accès refusé.',
      );
    }

    return true;
  }
}

