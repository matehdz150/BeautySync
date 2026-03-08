import { PublicUser } from '../entities/publicUser.entity';

export interface PublicSessionsRepositoryPort {
  create(data: {
    publicUserId: string;
    expiresAt: Date;
    userAgent?: string | null;
    ip?: string | null;
  }): Promise<{
    id: string;
    expiresAt: Date;
  }>;

  findValid(sessionId: string): Promise<PublicUser | null>;

  delete(sessionId: string): Promise<void>;
}
