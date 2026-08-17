import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/tenant-rbac.dto';
import { SectorType } from '../../core/types/tenant.types';

@Injectable()
export class TenantRbacService {
  constructor(private prisma: PrismaService) {}

  private get tenantId(): string {
    const store = TenantContextService.getStore();
    if (!store?.tenantId) throw new ForbiddenException('Tenant context is missing');
    return store.tenantId;
  }

  async getAvailablePermissions() {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: this.tenantId }
    });
    
    if (!tenant) throw new NotFoundException('Tenant not found');

    // Return permissions applicable to this sector or global permissions (sectorType = null)
    return this.prisma.permission.findMany({
      where: {
        OR: [
          { sectorType: tenant.sectorType },
          { sectorType: null }
        ]
      }
    });
  }

  async getRoles() {
    return this.prisma.role.findMany({
      where: { tenantId: this.tenantId },
      include: {
        rolePermissions: {
          include: { permission: true }
        },
        _count: {
          select: { userRoles: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  private async validatePermissionsAssignment(prisma: any, requestedCodes: string[]) {
    const store = TenantContextService.getStore();
    const isSuperAdmin = store?.isSuperAdmin;
    
    // 1. Fetch DB permissions
    const permissions = await prisma.permission.findMany({
      where: { code: { in: requestedCodes } }
    });
    
    // 2. Check for non-existent permissions
    const foundCodes = permissions.map((p: any) => p.code);
    const invalidCodes = requestedCodes.filter(code => !foundCodes.includes(code));
    if (invalidCodes.length > 0) {
      throw new BadRequestException(`Les permissions suivantes n'existent pas : ${invalidCodes.join(', ')}`);
    }

    // 3. SuperAdmin bypass
    if (isSuperAdmin) return permissions;

    // 4. Verify current user's own permissions
    const userId = store?.userId;
    if (!userId) throw new ForbiddenException('User context is missing');

    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } }
    });

    const currentUserPermissionCodes = new Set<string>();
    for (const ur of userRoles) {
      for (const rp of ur.role.rolePermissions) {
        currentUserPermissionCodes.add(rp.permission.code);
      }
    }

    const forbiddenCodes = requestedCodes.filter(code => !currentUserPermissionCodes.has(code));
    if (forbiddenCodes.length > 0) {
      throw new ForbiddenException(`Vous n'avez pas le droit d'attribuer ces permissions : ${forbiddenCodes.join(', ')}`);
    }

    return permissions;
  }

  async createRole(dto: CreateRoleDto) {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Create the role
      const role = await prisma.role.create({
        data: {
          name: dto.name,
          description: dto.description,
          tenantId: this.tenantId
        }
      });

      // 2. Resolve permission codes to IDs
      if (dto.permissions && dto.permissions.length > 0) {
        const permissions = await this.validatePermissionsAssignment(prisma, dto.permissions);

        // 3. Create role-permission links
        if (permissions.length > 0) {
          await prisma.rolePermission.createMany({
            data: permissions.map(p => ({
              roleId: role.id,
              permissionId: p.id
            }))
          });
        }
      }

      return this.prisma.role.findUnique({
        where: { id: role.id },
        include: { rolePermissions: { include: { permission: true } } }
      });
    });
  }

  async updateRole(roleId: string, dto: UpdateRoleDto) {
    const existingRole = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId: this.tenantId }
    });

    if (!existingRole) throw new NotFoundException('Role non trouvé dans ce tenant');
    if (existingRole.name === 'ADMIN_TENANT' || existingRole.name === 'EMPLOYEE') {
      throw new ForbiddenException('Les rôles systèmes ne peuvent pas être modifiés.');
    }

    return this.prisma.$transaction(async (prisma) => {
      // 1. Update basic fields
      if (dto.name || dto.description) {
        await prisma.role.update({
          where: { id: roleId },
          data: {
            name: dto.name ?? existingRole.name,
            description: dto.description ?? existingRole.description,
          }
        });
      }

      // 2. Update permissions if provided
      if (dto.permissions) {
        // Delete all old permissions for this role
        await prisma.rolePermission.deleteMany({
          where: { roleId }
        });

        if (dto.permissions.length > 0) {
          const permissions = await this.validatePermissionsAssignment(prisma, dto.permissions);
          
          if (permissions.length > 0) {
            await prisma.rolePermission.createMany({
              data: permissions.map(p => ({
                roleId,
                permissionId: p.id
              }))
            });
          }
        }
      }

      return this.prisma.role.findUnique({
        where: { id: roleId },
        include: { rolePermissions: { include: { permission: true } } }
      });
    });
  }

  async deleteRole(roleId: string) {
    const existingRole = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId: this.tenantId },
      include: { _count: { select: { userRoles: true } } }
    });

    if (!existingRole) throw new NotFoundException('Role non trouvé dans ce tenant');
    if (existingRole.name === 'ADMIN_TENANT' || existingRole.name === 'EMPLOYEE') {
      throw new ForbiddenException('Les rôles systèmes ne peuvent pas être supprimés.');
    }
    
    if (existingRole._count.userRoles > 0) {
      throw new ForbiddenException('Ce rôle est assigné à des employés actifs. Veuillez les réassigner avant la suppression.');
    }

    await this.prisma.role.delete({
      where: { id: roleId }
    });

    return { success: true };
  }
}
