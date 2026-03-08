import { Inject } from '@nestjs/common';

import * as publicSessionsRepositoryPort from '../../ports/public-sessions.repository.port';
import { PUBLIC_SESSIONS_REPOSITORY } from '../../ports/tokens';

import { PublicUser } from '../../entities/publicUser.entity';

export class GetUserBySessionUseCase {
  constructor(
    @Inject(PUBLIC_SESSIONS_REPOSITORY)
    private sessionsRepo: publicSessionsRepositoryPort.PublicSessionsRepositoryPort,
  ) {}

  async execute(sessionId: string): Promise<PublicUser | null> {
    if (!sessionId) return null;

    const user = await this.sessionsRepo.findValid(sessionId);

    return user;
  }
}
