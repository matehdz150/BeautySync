/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as client from 'src/modules/db/client';
import { eq } from 'drizzle-orm';
import { users } from 'src/modules/db/schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject('DB') private db: client.DB) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        (req) => req?.cookies?.accessToken, // 🔥 LEER COOKIE
      ]),
      secretOrKey: process.env.JWT_ACCESS_SECRET!,
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }

    const user = await this.db.query.users.findFirst({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      where: eq(users.id, payload.sub),
    });

    if (!user) throw new UnauthorizedException();

    return {
      id: user.id,
      email: user.email,
      orgId: payload.orgId,
      role: payload.role,
    };
  }
}
