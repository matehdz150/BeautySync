import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as client from 'src/modules/db/client';
import { eq } from 'drizzle-orm';
import { users } from 'src/modules/db/schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject('DB') private db: client.DB) {
    console.log('🚀 JwtStrategy constructed');
    console.log('JWT STRATEGY SECRET =', process.env.JWT_ACCESS_SECRET);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET!,
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    console.log('PAYLOAD', payload);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!payload?.sub) {
      // Nunca permitas continuar sin user id
      throw new UnauthorizedException();
    }

    const user = await this.db.query.users.findFirst({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      where: eq(users.id, payload.sub),
    });

    if (!user) throw new UnauthorizedException();

    return {
      id: user.id,
      email: user.email,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      orgId: payload.orgId, // sigue ok
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      role: payload.role, // sigue ok
    };
  }
}
