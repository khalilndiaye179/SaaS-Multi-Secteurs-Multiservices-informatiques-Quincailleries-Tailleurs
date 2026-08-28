import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/tenant-rbac.dto';

@Injectable()
export class TenantRbacService {
  constructor(private prisma: PrismaService) {}

  private get tenantId(): string {
    const store = TenantContextService.getStore();
    if (!store?.tenantId) throw new ForbiddenException('Tenant context is missing');
    return store.tenantId;
  }

  async getAvailablePermissions() {
    // `permissions` table has no RLS — direct query is fine.
    // We use withoutTenantScope to set the RLS context for the `tenants` lookup.
    const tenantId = this.tenantId;
    const tenant = await this.prisma.withoutTenantScope(c =>
      c.tenant.findUnique({ where: { id: tenantId } })
    );
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.prisma.withoutTenantScope(c =>
      c.permission.findMany({
        where: {
          OR: [
            { sectorType: tenant.sectorType as any },
            { sectorType: null }
          ]
        }
      })
    );
  }

  async getRoles() {
    // `roles` table has RLS enabled but `Role` is NOT in TENANT_SCOPED_MODELS,
    // so PrismaService never sets app.current_tenant_id for it.
    // We use withoutTenantScope (sets __SYSTEM_GLOBAL_SUPERADMIN__) and
    // filter by tenantId explicitly to preserve tenant isolation.
    const tenantId = this.tenantId;
    return this.prisma.withoutTenantScope(c =>
      c.role.findMany({
        where: { tenantId },
        include: {
          rolePermissions: { include: { permission: true } },
          _count: { select: { userRoles: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    );
  }

  private async validatePermissionsAssignment(prismaClient: any, requestedCodes: string[]) {
    const store = TenantContextService.getStore();
    const isSuperAdmin = store?.isSuperAdmin;

    // 1. Fetch DB permissions
    const permissions = await prismaClient.permission.findMany({
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

    const userRoles = await prismaClient.userRole.findMany({
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
    const tenantId = this.tenantId;
    return this.prisma.withoutTenantScope(async (c) => {
      // 1. Create the role
      const role = await c.role.create({
        data: { name: dto.name, description: dto.description, tenantId }
      });

      // 2. Resolve permission codes to IDs and create links
      if (dto.permissions && dto.permissions.length > 0) {
        const permissions = await this.validatePermissionsAssignment(c, dto.permissions);
        if (permissions.length > 0) {
          await c.rolePermission.createMany({
            data: permissions.map((p: any) => ({ roleId: role.id, permissionId: p.id }))
          });
        }
      }

      return c.role.findUnique({
        where: { id: role.id },
        include: { rolePermissions: { include: { permission: true } } }
      });
    });
  }

  async updateRole(roleId: string, dto: UpdateRoleDto) {
    const tenantId = this.tenantId;

    const existingRole = await this.prisma.withoutTenantScope(c =>
      c.role.findFirst({ where: { id: roleId, tenantId } })
    );

    if (!existingRole) throw new NotFoundException('Rôle non trouvé dans ce tenant');
    if (existingRole.name === 'ADMIN_TENANT' || existingRole.name === 'EMPLOYEE') {
      throw new ForbiddenException('Les rôles systèmes ne peuvent pas être modifiés.');
    }

    return this.prisma.withoutTenantScope(async (c) => {
      // 1. Update basic fields
      if (dto.name || dto.description) {
        await c.role.update({
          where: { id: roleId },
          data: {
            name: dto.name ?? existingRole.name,
            description: dto.description ?? existingRole.description,
          }
        });
      }

      // 2. Update permissions if provided
      if (dto.permissions) {
        await c.rolePermission.deleteMany({ where: { roleId } });

        if (dto.permissions.length > 0) {
          const permissions = await this.validatePermissionsAssignment(c, dto.permissions);
          if (permissions.length > 0) {
            await c.rolePermission.createMany({
              data: permissions.map((p: any) => ({ roleId, permissionId: p.id }))
            });
          }
        }
      }

      return c.role.findUnique({
        where: { id: roleId },
        include: { rolePermissions: { include: { permission: true } } }
      });
    });
  }

  async deleteRole(roleId: string) {
    const tenantId = this.tenantId;

    const existingRole = await this.prisma.withoutTenantScope(c =>
      c.role.findFirst({
        where: { id: roleId, tenantId },
        include: { _count: { select: { userRoles: true } } }
      })
    );

    if (!existingRole) throw new NotFoundException('Rôle non trouvé dans ce tenant');
    if (existingRole.name === 'ADMIN_TENANT' || existingRole.name === 'EMPLOYEE') {
      throw new ForbiddenException('Les rôles systèmes ne peuvent pas être supprimés.');
    }
    if (existingRole._count.userRoles > 0) {
      throw new ForbiddenException('Ce rôle est assigné à des employés actifs. Veuillez les réassigner avant la suppression.');
    }

    await this.prisma.withoutTenantScope(c => c.role.delete({ where: { id: roleId } }));

    return { success: true };
  }
}
