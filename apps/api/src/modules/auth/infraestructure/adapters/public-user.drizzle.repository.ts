import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { publicUsers } from 'src/modules/db/schema';
import type { DB } from 'src/modules/db/client';

import { PublicUsersRepositoryPort } from '../../core/ports/public-users.repository.port';
import { PublicUser } from '../../core/entities/publicUser.entity';

@Injectable()
export class PublicUsersDrizzleRepository implements PublicUsersRepositoryPort {
  constructor(@Inject('DB') private readonly db: DB) {}

  async findById(id: string): Promise<PublicUser | null> {
    const row = await this.db.query.publicUsers.findFirst({
      where: eq(publicUsers.id, id),
    });

    if (!row) return null;

    return new PublicUser(
      row.id,
      row.email,
      row.googleSub,
      row.name,
      row.avatarUrl,
    );
  }

  async findByGoogleSub(sub: string): Promise<PublicUser | null> {
    const row = await this.db.query.publicUsers.findFirst({
      where: eq(publicUsers.googleSub, sub),
    });

    if (!row) return null;

    return new PublicUser(
      row.id,
      row.email,
      row.googleSub,
      row.name,
      row.avatarUrl,
    );
  }

  async findByEmail(email: string): Promise<PublicUser | null> {
    const row = await this.db.query.publicUsers.findFirst({
      where: eq(publicUsers.email, email),
    });

    if (!row) return null;

    return new PublicUser(
      row.id,
      row.email,
      row.googleSub,
      row.name,
      row.avatarUrl,
    );
  }

  async create(data: {
    email: string | null;
    googleSub: string;
    name: string | null;
    avatarUrl: string | null;
  }): Promise<PublicUser> {
    const [row] = await this.db.insert(publicUsers).values(data).returning();

    return new PublicUser(
      row.id,
      row.email,
      row.googleSub,
      row.name,
      row.avatarUrl,
    );
  }

  async updateLogin(
    userId: string,
    data: {
      email?: string | null;
      name?: string | null;
      avatarUrl?: string | null;
    },
  ): Promise<void> {
    await this.db
      .update(publicUsers)
      .set({
        ...data,
        lastLoginAt: new Date(),
      })
      .where(eq(publicUsers.id, userId));
  }
}
