import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as client from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@Inject('DB') private db: client.DB) {}

  async findAll() {
    return this.db.select().from(users);
  }

  async findOne(id: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string) {
    return this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }

  async create({
    email,
    name,
    password,
    organizationId,
    role = 'manager',
  }: {
    email: string;
    name?: string;
    password: string;
    organizationId: string;
    role?: string;
  }) {
    const exists = await this.findByEmail(email);
    if (exists) throw new BadRequestException('Email already registered');

    const passwordHash = await bcrypt.hash(password, 10);

    const [created] = await this.db
      .insert(users)
      .values({
        email,
        name,
        passwordHash,
        organizationId,
        role,
      })
      .returning();

    return created;
  }

  async update(
    id: string,
    data: Partial<{ name: string; avatarUrl: string; role: string }>,
  ) {
    await this.findOne(id); // <-- valida existencia

    const [updated] = await this.db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return updated;
  }

  async updatePassword(id: string, password: string) {
    await this.findOne(id);

    const passwordHash = await bcrypt.hash(password, 10);

    await this.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id));

    return { ok: true };
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.db.delete(users).where(eq(users.id, id));

    return { ok: true };
  }
}
