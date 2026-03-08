import { Inject, UnauthorizedException } from '@nestjs/common';

import * as publicUsersRepositoryPort from '../../ports/public-users.repository.port';
import * as publicSessionsRepositoryPort from '../../ports/public-sessions.repository.port';
import * as googleTokenVerifierPort from '../../ports/google-token-verifier.port';
import {
  GOOGLE_TOKEN_VERIFIER,
  PUBLIC_SESSIONS_REPOSITORY,
  PUBLIC_USERS_REPOSITORY,
} from '../../ports/tokens';

type LoginGoogleResult = {
  userId: string;
  sessionId: string;
  expiresAt: Date;
};

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export class LoginGoogleUseCase {
  constructor(
    @Inject(PUBLIC_USERS_REPOSITORY)
    private usersRepo: publicUsersRepositoryPort.PublicUsersRepositoryPort,
    @Inject(PUBLIC_SESSIONS_REPOSITORY)
    private sessionsRepo: publicSessionsRepositoryPort.PublicSessionsRepositoryPort,
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

    const ttlDays = Number(process.env.PUBLIC_SESSION_TTL_DAYS ?? '30');

    const expiresAt = addDays(new Date(), ttlDays);

    const session = await this.sessionsRepo.create({
      publicUserId: user.id,
      expiresAt,
      userAgent: input.userAgent ?? null,
      ip: input.ip ?? null,
    });

    return {
      userId: user.id,
      sessionId: session.id,
      expiresAt: session.expiresAt,
    };
  }
}
