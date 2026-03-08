import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt } from 'drizzle-orm';

import type { DB } from 'src/modules/db/client';

import { publicSessions } from 'src/modules/db/schema/public/public-sessions';
import { publicUsers } from 'src/modules/db/schema';

import { PublicSessionsRepositoryPort } from '../../core/ports/public-sessions.repository.port';
import { PublicUser } from '../../core/entities/publicUser.entity';

@Injectable()
export class PublicSessionsDrizzleRepository implements PublicSessionsRepositoryPort {
  constructor(@Inject('DB') private readonly db: DB) {}

  async create(data: {
    publicUserId: string;
    expiresAt: Date;
    userAgent?: string | null;
    ip?: string | null;
  }) {
    const [row] = await this.db
      .insert(publicSessions)
      .values({
        publicUserId: data.publicUserId,
        expiresAt: data.expiresAt,
        userAgent: data.userAgent ?? null,
        ip: data.ip ?? null,
      })
      .returning({
        id: publicSessions.id,
        expiresAt: publicSessions.expiresAt,
      });

    return row;
  }

  async findValid(sessionId: string): Promise<PublicUser | null> {
    const row = await this.db
      .select({
        id: publicUsers.id,
        email: publicUsers.email,
        googleSub: publicUsers.googleSub,
        name: publicUsers.name,
        avatarUrl: publicUsers.avatarUrl,
      })
      .from(publicSessions)
      .innerJoin(publicUsers, eq(publicSessions.publicUserId, publicUsers.id))
      .where(
        and(
          eq(publicSessions.id, sessionId),
          gt(publicSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!row.length) return null;

    const user = row[0];

    return new PublicUser(
      user.id,
      user.email,
      user.googleSub,
      user.name,
      user.avatarUrl,
    );
  }

  async delete(sessionId: string): Promise<void> {
    await this.db
      .delete(publicSessions)
      .where(eq(publicSessions.id, sessionId));
  }
}
