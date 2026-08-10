import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId?: string;
  sectorType?: string;
  userId?: string;
  roles?: string[];
  isSuperAdmin?: boolean;
  isSystemContext?: boolean;
}

@Injectable()
export class TenantContextService {
  private static asyncLocalStorage = new AsyncLocalStorage<TenantContext>();

  static getStore(): TenantContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  static run<T>(store: TenantContext, callback: () => T): T {
    return this.asyncLocalStorage.run(store, callback);
  }

  static getTenantId(): string | undefined {
    return this.getStore()?.tenantId;
  }

  static isSuperAdmin(): boolean {
    return !!this.getStore()?.isSuperAdmin;
  }

  static isSystemContext(): boolean {
    return !!this.getStore()?.isSystemContext;
  }

  static runWithSystemContext<T>(callback: () => T): T {
    const currentStore = this.getStore() || {};
    return this.asyncLocalStorage.run(
      { ...currentStore, isSystemContext: true },
      callback,
    );
  }

  static runWithTenantContext<T>(
    tenantId: string,
    sectorType: string,
    callback: () => T,
  ): T {
    const currentStore = this.getStore() || {};
    return this.asyncLocalStorage.run(
      { ...currentStore, tenantId, sectorType, isSystemContext: false },
      callback,
    );
  }
}
