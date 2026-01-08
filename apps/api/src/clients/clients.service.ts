import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as client from 'src/db/client';
import { clients } from 'src/db/schema';
import { eq } from 'drizzle-orm';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(@Inject('DB') private db: client.DB) {}

  findAll() {
    return this.db.select().from(clients);
  }

  async findOne(id: string) {
    const row = await this.db.query.clients.findFirst({
      where: eq(clients.id, id),
    });

    if (!row) throw new BadRequestException('Client not found');

    return row;
  }

  async create(dto: CreateClientDto) {
    const [c] = await this.db.insert(clients).values(dto).returning();
    return c;
  }

  async update(id: string, dto: UpdateClientDto) {
    const [c] = await this.db
      .update(clients)
      .set(dto)
      .where(eq(clients.id, id))
      .returning();

    if (!c) throw new BadRequestException('Client not found');

    return c;
  }

  async remove(id: string) {
    const res = await this.db
      .delete(clients)
      .where(eq(clients.id, id))
      .returning();

    if (res.length === 0) {
      throw new BadRequestException('Client not found');
    }

    return { ok: true };
  }

  async findByOrganization(organizationId: string) {
    const rows = await this.db.query.clients.findMany({
      where: eq(clients.organizationId, organizationId),
    });

    if (!rows.length) {
      throw new BadRequestException('No clients found for this organization');
    }

    return rows;
  }
}
