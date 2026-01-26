import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as client from 'src/modules/db/client';
import { organizations } from 'src/modules/db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class OrganizationsService {
  constructor(@Inject('DB') private db: client.DB) {}

  async findAll() {
    return this.db.select().from(organizations);
  }

  async findOne(id: string) {
    const org = await this.db.query.organizations.findFirst({
      where: eq(organizations.id, id),
    });

    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async create(name: string) {
    const [org] = await this.db
      .insert(organizations)
      .values({ name })
      .returning();

    return org;
  }
}
