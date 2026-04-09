import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

import { AuthenticatedUser } from '../../core/entities/authenticatedUser.entity';

export type JwtPayload = {
  sub: string;
  role: string;
  orgId: string | null;
  branchIds?: string[];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
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

    return new AuthenticatedUser(
      payload.sub,
      payload.role,
      payload.orgId,
      payload.branchIds ?? [],
    );
  }
}
