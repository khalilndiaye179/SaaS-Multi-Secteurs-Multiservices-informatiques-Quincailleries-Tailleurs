import { Test, TestingModule } from '@nestjs/testing';
import { SuperAdminTeamService } from './super-admin-team.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from './audit-log.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { ConflictException, ForbiddenException } from '@nestjs/common';

describe('SuperAdminTeamService (Privilege Escalation & Security)', () => {
  let service: SuperAdminTeamService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      withoutTenantScope: jest.fn((callback) => callback(prismaService)),
      superAdminInvitation: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      userRole: {
        count: jest.fn(),
        findFirst: jest.fn(),
        deleteMany: jest.fn(),
        create: jest.fn(),
      },
      role: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      tenant: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaService)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperAdminTeamService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AuditLogService, useValue: { record: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    service = module.get<SuperAdminTeamService>(SuperAdminTeamService);
  });

  it('1. Invitation : Stocke uniquement tokenHash (SHA-256) et ne conserve JAMAIS le token brut en BDD', async () => {
    jest.spyOn(TenantContextService, 'getStore').mockReturnValue({ isSuperAdmin: true } as any);
    prismaService.user.findFirst.mockResolvedValue(null);
    prismaService.superAdminInvitation.create.mockImplementation((args: any) => ({
      id: 'inv-1',
      ...args.data,
    }));

    const result = await service.inviteCollaborator({
      email: 'collaborator@doorwaar.sn',
      roleName: 'FINANCE',
    });

    expect(result.invitationLink).toContain('token=');
    expect(prismaService.superAdminInvitation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'collaborator@doorwaar.sn',
          roleName: 'FINANCE',
          tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/), // Hash SHA-256 valide
        }),
      }),
    );
  });

  it('2. Protection du dernier SUPER_ADMIN : Empeche de modifier le role du seul SUPER_ADMIN actif', async () => {
    jest.spyOn(TenantContextService, 'getStore').mockReturnValue({ isSuperAdmin: true } as any);

    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-admin-1',
      userRoles: [{ role: { name: 'SUPER_ADMIN' } }],
    });

    // Seul 1 SUPER_ADMIN existe
    prismaService.userRole.count.mockResolvedValue(1);

    await expect(
      service.updateRole('user-admin-1', { roleName: 'FINANCE' }),
    ).rejects.toThrow(ConflictException);
  });

  it('3. Auto-Desactivation interdite : Empeche un Super Admin de desactiver son propre compte', async () => {
    jest.spyOn(TenantContextService, 'getStore').mockReturnValue({
      userId: 'user-admin-1',
      isSuperAdmin: true,
    } as any);

    await expect(service.toggleStatus('user-admin-1', false)).rejects.toThrow(ForbiddenException);
  });
});
