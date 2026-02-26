import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as client from 'src/modules/db/client';
import { clients } from 'src/modules/db/schema';
import { eq, sql } from 'drizzle-orm';
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
    const rows = await this.db.execute<{
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
      avatarUrl: string | null;
      totalBookings: number;
      averageRating: number | null;
      ratingCount: number;
    }>(sql`
    SELECT
      c.id,
      c.name,
      c.email,
      c.phone,
      c.avatar_url as "avatarUrl",

      COUNT(DISTINCT b.id) as "totalBookings",

      ROUND(AVG(r.rating)::numeric, 2) as "averageRating",

      COUNT(DISTINCT r.id) as "ratingCount"

    FROM clients c

    LEFT JOIN public_user_clients puc
      ON puc.client_id = c.id

    LEFT JOIN public_bookings b
      ON b.public_user_id = puc.public_user_id

    LEFT JOIN public_booking_ratings r
      ON r.public_user_id = puc.public_user_id

    WHERE c.organization_id = ${organizationId}

    GROUP BY c.id

    ORDER BY c.created_at DESC
  `);

    return rows ?? [];
  }
}
