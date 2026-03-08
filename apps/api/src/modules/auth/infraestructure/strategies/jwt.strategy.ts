import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Request } from 'express';

import type { DB } from 'src/modules/db/client';
import { users } from 'src/modules/db/schema';

import { AuthenticatedUser } from '../../core/entities/authenticatedUser.entity';

export type JwtPayload = {
  sub: string;
  role: string;
  orgId: string | null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject('DB')
    private readonly db: DB,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req.cookies?.accessToken ?? null,
      ]),
      secretOrKey: process.env.JWT_ACCESS_SECRET!,
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }

    const user = await this.db.query.users.findFirst({
      where: eq(users.id, payload.sub),
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return new AuthenticatedUser(user.id, user.role, user.organizationId);
  }
}
