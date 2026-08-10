import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types/tenant.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'kpsy_super_secret_jwt_key_2026_uemoa_multi_sector_app',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.tenantId) {
      throw new UnauthorizedException('Token invalide ou incomplet.');
    }

    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      sectorType: payload.sectorType,
      roles: payload.roles,
      tenantCode: payload.tenantCode,
    };
  }

}
