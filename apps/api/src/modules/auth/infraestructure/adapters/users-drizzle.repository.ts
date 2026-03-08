import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { users } from 'src/modules/db/schema';
import type { DB } from 'src/modules/db/client';

import { UsersRepositoryPort } from '../../core/ports/users.repository';
import { User } from '../../core/entities/user.entity';

@Injectable()
export class UsersDrizzleRepository implements UsersRepositoryPort {
  constructor(@Inject('DB') private readonly db: DB) {}

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!row) return null;

    return new User(
      row.id,
      row.email,
      row.passwordHash,
      row.role,
      row.organizationId,
    );
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!row) return null;

    return new User(
      row.id,
      row.email,
      row.passwordHash,
      row.role,
      row.organizationId,
    );
  }

  async create(data: {
    email: string;
    passwordHash: string;
    role: string;
    organizationId?: string | null;
  }): Promise<User> {
    const [row] = await this.db.insert(users).values(data).returning();

    return new User(
      row.id,
      row.email,
      row.passwordHash,
      row.role,
      row.organizationId,
    );
  }
}
