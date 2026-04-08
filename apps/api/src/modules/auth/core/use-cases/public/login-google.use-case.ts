import { Inject, UnauthorizedException } from '@nestjs/common';

import * as publicUsersRepositoryPort from '../../ports/public-users.repository.port';
import * as googleTokenVerifierPort from '../../ports/google-token-verifier.port';
import {
  GOOGLE_TOKEN_VERIFIER,
  PUBLIC_USERS_REPOSITORY,
} from '../../ports/tokens';

type LoginGoogleResult = {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    avatarUrl: string | null;
  };
};

export class LoginGoogleUseCase {
  constructor(
    @Inject(PUBLIC_USERS_REPOSITORY)
    private usersRepo: publicUsersRepositoryPort.PublicUsersRepositoryPort,
    @Inject(GOOGLE_TOKEN_VERIFIER)
    private googleVerifier: googleTokenVerifierPort.GoogleTokenVerifierPort,
  ) {}

  async execute(input: {
    idToken: string;
    userAgent?: string | null;
    ip?: string | null;
  }): Promise<LoginGoogleResult> {
    if (!input.idToken) {
      throw new UnauthorizedException('idToken is required');
    }

    const payload = await this.googleVerifier.verify(input.idToken);

    const googleSub = payload.sub;
    const email = payload.email ?? null;
    const emailVerified = payload.emailVerified === true;

    if (!googleSub) {
      throw new UnauthorizedException('Invalid google token');
    }

    let user = await this.usersRepo.findByGoogleSub(googleSub);

    if (!user && email && emailVerified) {
      user = await this.usersRepo.findByEmail(email);
    }

    if (!user) {
      user = await this.usersRepo.create({
        email: emailVerified ? email : null,
        googleSub,
        name: payload.name ?? null,
        avatarUrl: payload.avatarUrl ?? null,
      });
    } else {
      await this.usersRepo.updateLogin(user.id, {
        email: emailVerified ? email : user.email,
        name: payload.name ?? user.name,
        avatarUrl: payload.avatarUrl ?? user.avatarUrl,
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
