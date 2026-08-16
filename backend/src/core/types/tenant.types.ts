// Core Types & Interfaces pour SaaS Multi-Secteurs UEMOA

export enum SectorType {
  QUINCAILLERIE = 'QUINCAILLERIE',
  MULTISERVICES_IT = 'MULTISERVICES_IT',
  TAILLEUR = 'TAILLEUR',
}

export enum CountryUEMOA {
  SENEGAL = 'SN',
  COTE_D_IVOIRE = 'CI',
  MALI = 'ML',
}

export enum RoleType {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN_TENANT = 'ADMIN_TENANT',
  EMPLOYEE = 'EMPLOYEE',
}

export enum BillingStatus {
  TRIAL_7D = 'TRIAL_7D',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED',
}

export interface JwtPayload {
  sub: string;
  tenantId: string;
  sectorType: SectorType;
  roles: RoleType[];
  tenantCode: string;
  billingStatus?: BillingStatus;
  iat?: number;
  exp?: number;
}


export interface TenantContext {
  tenantId: string;
  sectorType: SectorType;
  roles: RoleType[];
}
