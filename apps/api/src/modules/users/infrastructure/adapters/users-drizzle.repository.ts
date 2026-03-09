import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateUserInput,
  UpdateUserInput,
  UsersRepository,
} from '../../core/ports/users.repository';
import * as client from 'src/modules/db/client';
import { User } from '../../core/entities/user.entity';
import { users } from 'src/modules/db/schema/users';
import { eq } from 'drizzle-orm';
import { UserMapper } from '../mappers/user.mapper';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersDrizzleRepository implements UsersRepository {
  constructor(@Inject('DB') private db: client.DB) {}

  async findAll(): Promise<User[]> {
    const rows = await this.db.select().from(users);
    return rows.map((row) => UserMapper.toDomain(row));
  }

  async findOne(id: string): Promise<User> {
    const row = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!row) {
      throw new NotFoundException('User not found');
    }

    return UserMapper.toDomain(row);
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!row) {
      return null;
    }

    return UserMapper.toDomain(row);
  }

  async create(data: CreateUserInput): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 10);

    const [created] = await this.db
      .insert(users)
      .values({
        email: data.email,
        name: data.name,
        passwordHash,
        organizationId: data.organizationId,
        role: data.role ?? 'manager',
      })
      .returning();

    return UserMapper.toDomain(created);
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    const [updated] = await this.db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return UserMapper.toDomain(updated);
  }

  async updatePassword(id: string, passwordHash: string) {
    await this.db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async remove(id: string) {
    await this.db.delete(users).where(eq(users.id, id));
  }
}
