import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

type ManagerTokenUser = {
  id: string;
  role: string;
  organizationId: string | null;
  branchIds: string[];
};

type PublicTokenUser = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

@Injectable()
export class TokensService {
  constructor(private jwt: JwtService) {}

  signManagerTokens(user: ManagerTokenUser) {
    const payload = {
      sub: user.id,
      orgId: user.organizationId,
      role: user.role,
      branchIds: user.branchIds,
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

  signPublicToken(user: PublicTokenUser) {
    return this.jwt.sign(
      {
        publicUserId: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      {
        secret: process.env.PUBLIC_JWT_SECRET ?? process.env.JWT_ACCESS_SECRET!,
        expiresIn: `${Number(process.env.PUBLIC_SESSION_TTL_DAYS ?? '30')}d`,
      },
    );
  }

  verifyPublicToken(token: string): PublicTokenUser {
    const payload = this.jwt.verify<{
      publicUserId: string;
      email: string | null;
      name: string | null;
      avatarUrl: string | null;
    }>(token, {
      secret: process.env.PUBLIC_JWT_SECRET ?? process.env.JWT_ACCESS_SECRET!,
    });

    return {
      id: payload.publicUserId,
      email: payload.email ?? null,
      name: payload.name ?? null,
      avatarUrl: payload.avatarUrl ?? null,
    };
  }
}
