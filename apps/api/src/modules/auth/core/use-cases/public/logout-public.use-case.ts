import { PublicSessionsRepositoryPort } from '../../ports/public-sessions.repository.port';

export class LogoutPublicUseCase {
  constructor(private sessionsRepo: PublicSessionsRepositoryPort) {}

  async execute(sessionId: string): Promise<void> {
    if (!sessionId) return;

    await this.sessionsRepo.delete(sessionId);
  }
}
