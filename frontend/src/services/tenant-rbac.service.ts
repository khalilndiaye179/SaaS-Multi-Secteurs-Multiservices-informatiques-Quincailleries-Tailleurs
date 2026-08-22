import { ApiClient } from './api-client';

export interface PermissionData {
  id: string;
  code: string;
  description: string;
  sectorType: string | null;
}

export interface RolePermissionData {
  roleId: string;
  permissionId: string;
  permission: PermissionData;
}

export interface RoleData {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  rolePermissions: RolePermissionData[];
  _count: {
    userRoles: number;
  };
}

export class TenantRbacApiService {
  static async getPermissions(): Promise<PermissionData[]> {
    return ApiClient.get<PermissionData[]>('/api/tenant/rbac/permissions');
  }

  static async getRoles(): Promise<RoleData[]> {
    return ApiClient.get<RoleData[]>('/api/tenant/rbac/roles');
  }

  static async createRole(dto: { name: string; description?: string; permissions: string[] }): Promise<RoleData> {
    return ApiClient.post<RoleData>('/api/tenant/rbac/roles', dto);
  }

  static async updateRole(id: string, dto: { name?: string; description?: string; permissions?: string[] }): Promise<RoleData> {
    return ApiClient.put<RoleData>(`/api/tenant/rbac/roles/${id}`, dto);
  }

  static async deleteRole(id: string): Promise<any> {
    return ApiClient.delete<any>(`/api/tenant/rbac/roles/${id}`);
  }
}
