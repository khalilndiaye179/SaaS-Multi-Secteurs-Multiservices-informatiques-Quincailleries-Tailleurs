import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { TenantContextService } from '../../tenant/tenant-context.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }

    const store = TenantContextService.getStore();

    if (!store) {
      throw new ForbiddenException('Context not found');
    }

    // Bypass pour le Super Admin (qui a tous les droits implicites)
    if (store.isSuperAdmin) {
      return true;
    }

    const userPermissions = store.permissions || [];
    
    // Vérifier si l'utilisateur possède TOUTES les permissions requises (ou au moins UNE, selon la règle métier, ici on va dire TOUTES)
    const hasPermission = requiredPermissions.every((permission) => userPermissions.includes(permission));

    if (!hasPermission) {
      console.log("PERMISSION GUARD REJECTED", {
        required: requiredPermissions,
        userPerms: userPermissions,
        roles: store.roles,
        isSuperAdmin: store.isSuperAdmin
      });
      throw new ForbiddenException('Accès refusé. Permissions insuffisantes.');
    }

    return true;
  }
}
