// auth/refresh-jwt.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, ExtractJwt, StrategyOptionsWithRequest } from 'passport-jwt';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
        (req) => req?.cookies?.refreshToken,
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      ignoreExpiration: false,
      passReqToCallback: true,
    } as StrategyOptionsWithRequest); // 👈 ESTA LÍNEA ES LA CLAVE
  }

  validate(req: any, payload: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    console.log('REFRESH PAYLOAD', payload);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return payload;
  }
}
