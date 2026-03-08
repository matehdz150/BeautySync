import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokensService {
  constructor(private jwt: JwtService) {}

  signTokens(user: {
    id: string;
    role: string;
    organizationId: string | null;
  }) {
    const payload = {
      sub: user.id,
      orgId: user.organizationId,
      role: user.role,
    };

    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET!,
      expiresIn: '1h',
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET!,
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
