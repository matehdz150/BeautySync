import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { Request } from 'express';
import { eq } from 'drizzle-orm';

import type { DB } from 'src/modules/db/client';
import { users } from 'src/modules/db/schema';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh', // 🔥 ESTE NOMBRE ES EL QUE TE FALTABA
) {
  constructor(
    @Inject('DB')
    private readonly db: DB,
  ) {
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

    const user = await this.db.query.users.findFirst({
      where: eq(users.id, payload.sub),
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      sub: user.id,
      role: user.role,
      orgId: user.organizationId ?? null,
    };
  }
}
