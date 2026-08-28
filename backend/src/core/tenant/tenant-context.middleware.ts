import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    let store = {};

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET as string,
        });
        const isSuperAdmin = decoded?.roles?.includes('SUPER_ADMIN') || false;

        store = {
          tenantId: decoded.tenantId,
          sectorType: decoded.sectorType,
          userId: decoded.sub || decoded.userId,
          roles: decoded.roles || [],
          permissions: decoded.permissions || [],
          billingStatus: decoded.billingStatus,
          mustChangePassword: decoded.mustChangePassword,
          isSuperAdmin,
          isSystemContext: false,
        };
        (req as any).user = store;
      } catch (err) {
        // Token invalide ou expiré, le store reste vide
      }
    }


    TenantContextService.run(store, () => {
      next();
    });
  }
}
