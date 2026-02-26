import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as client from 'src/modules/db/client';
import { clients } from 'src/modules/db/schema';
import { eq, sql } from 'drizzle-orm';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { appointments } from 'src/modules/db/schema';

@Injectable()
export class ClientsService {
  constructor(@Inject('DB') private db: client.DB) {}

  findAll() {
    return this.db.select().from(clients);
  }

  async findOne(id: string) {
    // =========================
    // 🧍 CLIENT BASE
    // =========================
    const client = await this.db.query.clients.findFirst({
      where: eq(clients.id, id),
    });

    if (!client) {
      throw new BadRequestException('Client not found');
    }

    // =========================
    // 📊 STATS
    // =========================
    const [stats] = await this.db.execute<{
      totalAppointments: number;
      completedAppointments: number;
      cancelledAppointments: number;
      ratingCount: number;
      averageRating: number | null;
    }>(sql`
    SELECT
      (SELECT COUNT(*) FROM appointments WHERE client_id = ${id})::int as "totalAppointments",

      (SELECT COUNT(*) FROM appointments 
        WHERE client_id = ${id} AND status = 'COMPLETED')::int as "completedAppointments",

      (SELECT COUNT(*) FROM appointments 
        WHERE client_id = ${id} AND status = 'CANCELLED')::int as "cancelledAppointments",

      (SELECT COUNT(*) FROM public_booking_ratings pbr
        JOIN appointments a ON a.public_booking_id = pbr.booking_id
        WHERE a.client_id = ${id})::int as "ratingCount",

      (SELECT AVG(pbr.rating)::float FROM public_booking_ratings pbr
        JOIN appointments a ON a.public_booking_id = pbr.booking_id
        WHERE a.client_id = ${id}) as "averageRating"
  `);

    const safeStats = {
      totalAppointments: stats?.totalAppointments ?? 0,
      completedAppointments: stats?.completedAppointments ?? 0,
      cancelledAppointments: stats?.cancelledAppointments ?? 0,
      ratingCount: stats?.ratingCount ?? 0,
      averageRating:
        stats?.ratingCount > 0 ? Number(stats.averageRating) : null,
    };

    // =========================
    // 📅 PUBLIC BOOKINGS
    // =========================
    const bookings = await this.db.execute(sql`
    SELECT DISTINCT
      pb.id,
      pb.status,
      pb.starts_at as "startsAt",
      pb.ends_at as "endsAt",
      pb.payment_method as "paymentMethod",
      pb.total_cents as "totalCents",
      pb.created_at as "createdAt",
      b.id as "branchId",
      b.name as "branchName"
    FROM public_bookings pb
    JOIN appointments a ON a.public_booking_id = pb.id
    JOIN branches b ON b.id = pb.branch_id
    WHERE a.client_id = ${id}
    ORDER BY pb.starts_at DESC
  `);

    // =========================
    // 🧾 APPOINTMENTS (FULL)
    // =========================
    const appointmentsData = await this.db.query.appointments.findMany({
      where: eq(appointments.clientId, id),
      with: {
        staff: true,
        service: true,
        publicUser: true,
      },
      orderBy: (a, { desc }) => [desc(a.start)],
    });

    // =========================
    // 🔁 RESPONSE
    // =========================
    return {
      client,
      stats: safeStats,
      bookings,
      appointments: appointmentsData,
    };
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
