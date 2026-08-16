import { Test, TestingModule } from '@nestjs/testing';
import { SecurityCenterService } from './security-center.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../core/security/encryption.service';
import { AuditLogService } from './audit-log.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { ForbiddenException } from '@nestjs/common';

describe('SecurityCenterService (Real Security Inspection & Read-Only)', () => {
  let service: SecurityCenterService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      withoutTenantScope: jest.fn((callback) => callback(prismaService)),
      auditLog: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'log-1', action: 'SUPER_ADMIN_ROLE_CHANGED', result: 'SUCCESS', createdAt: new Date() },
        ]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityCenterService,
        { provide: PrismaService, useValue: prismaService },
        { provide: EncryptionService, useValue: {} },
        { provide: AuditLogService, useValue: { record: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    service = module.get<SecurityCenterService>(SecurityCenterService);
  });

  it('1. Security Overview : Inspection de la securite avec statut PASS sur tenant isolation et audit', async () => {
    jest.spyOn(TenantContextService, 'getStore').mockReturnValue({ isSuperAdmin: true } as any);

    const overview = await service.getSecurityOverview();
    expect(overview.status).toBe('WARNING'); // SGBD RLS est NOT_CONFIGURED
    expect(overview.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'tenant-isolation', status: 'PASS' }),
        expect.objectContaining({ id: 'postgres-rls', status: 'NOT_CONFIGURED' }),
      ]),
    );
  });

  it('2. Secrets : N\'expose JAMAIS la valeur des variables d\'environnement ou secrets', async () => {
    jest.spyOn(TenantContextService, 'getStore').mockReturnValue({ isSuperAdmin: true } as any);

    const overview = await service.getSecurityOverview();
    const secretCheck = overview.checks.find((c) => c.id === 'secrets-encryption');

    expect(secretCheck?.evidence).not.toContain(process.env.ENCRYPTION_KEY);
    expect(secretCheck?.evidence).toContain('configurée');
  });

  it('3. Read-Only Dependency Analysis : Analyse package.json sans modification', async () => {
    jest.spyOn(TenantContextService, 'getStore').mockReturnValue({ isSuperAdmin: true } as any);

    const deps = await service.getDependenciesAnalysis();
    expect(deps.vulnerabilityIntelligenceSource).toBe('NOT_CONFIGURED');
    expect(deps.dependencies.length).toBeGreaterThan(0);
  });

  it('4. RBAC : Refuse l\'accès au Security Center pour un utilisateur non Super Admin', async () => {
    jest.spyOn(TenantContextService, 'getStore').mockReturnValue({ tenantId: 't1', isSuperAdmin: false } as any);

    await expect(service.getSecurityOverview()).rejects.toThrow(ForbiddenException);
  });
});
