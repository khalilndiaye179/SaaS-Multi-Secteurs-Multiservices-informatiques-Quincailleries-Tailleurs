import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './require-permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../tenant/tenant-context.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const store = TenantContextService.getStore();
    
    // Si la route est publique ou qu'on n'a pas de store, on bloque car la permission est requise
    if (!store || !store.userId) {
      throw new ForbiddenException('Utilisateur non authentifié ou contexte introuvable.');
    }

    // Le Super Admin a toujours tous les droits implicitement
    if (store.isSuperAdmin) {
      return true;
    }

    // Récupérer les rôles et permissions de l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { id: store.userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new ForbiddenException('Utilisateur introuvable.');
    }

    // Extraire la liste plate des codes de permissions de l'utilisateur
    const userPermissions = new Set<string>();
    user.userRoles.forEach(ur => {
      ur.role.rolePermissions.forEach(rp => {
        userPermissions.add(rp.permission.code);
      });
    });

    // Vérifier si l'utilisateur possède au moins une des permissions requises (mode "OU")
    // (Ou modifier en `every()` pour un mode "ET" strict)
    const hasPermission = requiredPermissions.some(perm => userPermissions.has(perm));

    if (!hasPermission) {
      throw new ForbiddenException(`Vous n'avez pas la permission requise. (Requise: ${requiredPermissions.join(' ou ')})`);
    }

    return true;
  }
}
