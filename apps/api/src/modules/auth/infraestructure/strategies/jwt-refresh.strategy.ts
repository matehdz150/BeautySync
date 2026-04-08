import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh', // 🔥 ESTE NOMBRE ES EL QUE TE FALTABA
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req.cookies?.refreshToken ?? null, // 👈 refresh token
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET!, // 👈 OJO: otro secret
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }

    return {
      sub: payload.sub,
      role: payload.role,
      orgId: payload.orgId ?? null,
      branchIds: payload.branchIds ?? [],
    };
  }
}
