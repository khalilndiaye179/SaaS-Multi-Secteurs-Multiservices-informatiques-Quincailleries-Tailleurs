import { Test, TestingModule } from '@nestjs/testing';
import { AboutService } from './about.service';
import { AuditLogService } from './audit-log.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { ForbiddenException } from '@nestjs/common';

describe('AboutService (Read-Only Versioning & RBAC)', () => {
  let service: AboutService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AboutService,
        { provide: AuditLogService, useValue: { record: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    service = module.get<AboutService>(AboutService);
  });

  it('1. Version et Metadonnees provenant de la source serveur (package.json)', async () => {
    jest.spyOn(TenantContextService, 'getStore').mockReturnValue({ isSuperAdmin: true } as any);

    const info = await service.getAboutInfo();
    expect(info.appName).toBe('KPSyDesk Suite - Door Waar');
    expect(info.version).toBeDefined();
    expect(info.supportedSectors).toEqual(['QUINCAILLERIE', 'MULTISERVICES_IT', 'TAILLEUR']);
  });

  it('2. RBAC Security : Un utilisateur non Super Admin ne peut pas acceder aux infos systeme', async () => {
    jest.spyOn(TenantContextService, 'getStore').mockReturnValue({ tenantId: 't1', isSuperAdmin: false } as any);

    await expect(service.getAboutInfo()).rejects.toThrow(ForbiddenException);
  });
});
