import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TenantContextService } from '../tenant/tenant-context.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class MustChangePasswordGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const url = request.url;

    // Allow requests to /auth/change-password
    if (url.includes('/auth/change-password')) {
      return true;
    }

    const store = TenantContextService.getStore();

    if (store?.mustChangePassword) {
      throw new ForbiddenException(
        'Vous devez modifier votre mot de passe (mot de passe temporaire ou réinitialisé par un administrateur).'
      );
    }

    return true;
  }
}
