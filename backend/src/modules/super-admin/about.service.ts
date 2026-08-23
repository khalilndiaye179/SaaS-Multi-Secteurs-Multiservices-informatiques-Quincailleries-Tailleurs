import { Injectable } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AboutService {
  constructor(private auditLogService: AuditLogService) {}

  /**
   * Extrait la version et les métadonnées officielles de la plateforme (Read-Only)
   */
  async getAboutInfo() {
    const store = TenantContextService.getStore();

    const packagePath = path.join(process.cwd(), 'package.json');
    let pkg: any = {};

    if (fs.existsSync(packagePath)) {
      pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    }

    await this.auditLogService.record({
      action: 'ABOUT_VIEW',
      resourceType: 'PLATFORM_ABOUT',
      resourceId: 'SYSTEM_INFO',
      result: 'SUCCESS',
    });

    return {
      appName: 'KPSyDesk Suite - Door Waar',
      version: pkg.version || '1.0.0',
      description: pkg.description || 'Plateforme SaaS Multi-Secteurs UEMOA',
      author: pkg.author || 'Khalil NDIAYE',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      supportedSectors: ['QUINCAILLERIE', 'MULTISERVICES_IT', 'TAILLEUR'],
      architecture: 'NestJS Multi-Tenant + React Enterprise Console',
    };
  }
}
