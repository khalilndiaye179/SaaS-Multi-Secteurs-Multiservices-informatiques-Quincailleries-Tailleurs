import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TotpEnforcementGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by JwtStrategy

    if (!user || !user.tenantId || !user.sub) {
      return true; // We don't block unauthenticated routes here, JwtGuard handles that
    }

    // This guard only applies to SAAS-GLOBAL users
    if (user.tenantCode !== 'SAAS-GLOBAL') {
      return true;
    }

    // Check if enforcement is enabled
    const settings = await this.prisma.withoutTenantScope(c =>
      c.platformSettings.findUnique({ where: { id: 'singleton' } })
    );

    if (!settings || !settings.enforce2FA) {
      return true;
    }

    // Allow access to 2FA setup routes even if enforced
    const allowedPaths = ['/api/auth/2fa/setup', '/api/auth/2fa/enable', '/api/auth/login', '/api/auth/login/verify-totp'];
    if (allowedPaths.includes(request.path) || request.path.startsWith('/api/auth/')) {
      return true;
    }

    // Fetch user 2FA status
    const dbUser = await this.prisma.withoutTenantScope(c =>
      c.user.findUnique({ where: { id: user.sub } })
    );

    if (!dbUser?.totpEnabled) {
      throw new ForbiddenException('Le Super Admin a rendu l\'authentification à deux facteurs (2FA) obligatoire. Veuillez configurer votre 2FA.');
    }

    return true;
  }
}
