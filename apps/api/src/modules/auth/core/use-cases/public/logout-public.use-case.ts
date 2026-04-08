import { Inject } from '@nestjs/common';
import * as publicSessionsRepositoryPort from '../../ports/public-sessions.repository.port';
import { PUBLIC_SESSIONS_REPOSITORY } from '../../ports/tokens';

export class LogoutPublicUseCase {
  constructor(
    @Inject(PUBLIC_SESSIONS_REPOSITORY)
    private sessionsRepo: publicSessionsRepositoryPort.PublicSessionsRepositoryPort,
  ) {}

  async execute(sessionId: string): Promise<void> {
    if (!sessionId) return;

    await this.sessionsRepo?.delete(sessionId);
  }
}
