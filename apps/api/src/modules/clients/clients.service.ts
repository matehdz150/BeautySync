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
    const [statsRow] = await this.db.execute<{
      totalAppointments: number;
      completedAppointments: number;
      cancelledAppointments: number;
      ratingCount: number;
      averageRating: number | null;
    }>(sql`
    SELECT
      COUNT(a.id)::int as "totalAppointments",
      COUNT(a.id) FILTER (WHERE a.status = 'COMPLETED')::int as "completedAppointments",
      COUNT(a.id) FILTER (WHERE a.status = 'CANCELLED')::int as "cancelledAppointments",
      COUNT(DISTINCT pbr.id)::int as "ratingCount",
      AVG(pbr.rating)::float as "averageRating"
    FROM appointments a
    LEFT JOIN public_booking_ratings pbr
      ON pbr.booking_id = a.public_booking_id
    WHERE a.client_id = ${id}
  `);

    const stats = {
      totalAppointments: statsRow?.totalAppointments ?? 0,
      completedAppointments: statsRow?.completedAppointments ?? 0,
      cancelledAppointments: statsRow?.cancelledAppointments ?? 0,
      ratingCount: statsRow?.ratingCount ?? 0,
      averageRating:
        statsRow?.ratingCount > 0 ? Number(statsRow.averageRating) : null,
    };

    // =========================
    // 📅 BOOKINGS
    // =========================
    const bookingsRaw = await this.db.execute<{
      id: string;
      status: string;
      startsAt: string;
      endsAt: string;
      paymentMethod: string;
      totalCents: number;
      createdAt: string;
      branchId: string;
      branchName: string;
    }>(sql`
    SELECT
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
    GROUP BY pb.id, b.id
    ORDER BY pb.starts_at DESC
  `);

    // =========================
    // 🧾 APPOINTMENTS
    // =========================
    const appointmentsRaw = await this.db.execute<{
      id: string;
      publicBookingId: string | null;
      start: string;
      end: string;
      status: string;
      priceCents: number | null;

      staffId: string;
      staffName: string;
      staffAvatarUrl: string | null;
      staffJobRole: string | null;

      serviceId: string;
      serviceName: string;
      serviceDurationMin: number;
      servicePriceCents: number;

      publicUserId: string | null;
      publicUserName: string | null;
      publicUserEmail: string | null;
      publicUserAvatarUrl: string | null;
    }>(sql`
    SELECT
      a.id,
      a.public_booking_id as "publicBookingId",
      a.start,
      a.end,
      a.status,
      a.price_cents as "priceCents",

      s.id as "staffId",
      s.name as "staffName",
      s.avatar_url as "staffAvatarUrl",
      s."jobRole" as "staffJobRole",

      sv.id as "serviceId",
      sv.name as "serviceName",
      sv.duration_min as "serviceDurationMin",
      sv.price_cents as "servicePriceCents",

      pu.id as "publicUserId",
      pu.name as "publicUserName",
      pu.email as "publicUserEmail",
      pu.avatar_url as "publicUserAvatarUrl"

    FROM appointments a
    JOIN staff s ON s.id = a.staff_id
    JOIN services sv ON sv.id = a.service_id
    LEFT JOIN public_users pu ON pu.id = a.public_user_id
    WHERE a.client_id = ${id}
  `);

    // =========================
    // 🔗 AGRUPAR
    // =========================
    const bookings = bookingsRaw.map((booking) => {
      const bookingAppointments = appointmentsRaw
        .filter((a) => a.publicBookingId === booking.id)
        .map((a) => ({
          id: a.id,
          start: a.start,
          end: a.end,
          status: a.status,
          priceCents: a.priceCents ?? null,

          staff: {
            id: a.staffId,
            name: a.staffName,
            avatarUrl: a.staffAvatarUrl ?? null,
            jobRole: a.staffJobRole ?? null,
          },

          service: {
            id: a.serviceId,
            name: a.serviceName,
            durationMin: a.serviceDurationMin,
            priceCents: a.servicePriceCents,
          },

          publicUser: a.publicUserId
            ? {
                id: a.publicUserId,
                name: a.publicUserName ?? null,
                email: a.publicUserEmail ?? null,
                avatarUrl: a.publicUserAvatarUrl ?? null,
              }
            : null,
        }));

      return {
        ...booking,
        appointments: bookingAppointments,
      };
    });

    // =========================
    // 🔁 FINAL RESPONSE
    // =========================
    return {
      client: {
        id: client.id,
        name: client.name ?? null,
        email: client.email ?? null,
        phone: client.phone ?? null,
        avatarUrl: client.avatarUrl ?? null,
        createdAt: client.createdAt?.toISOString?.() ?? null,
      },
      stats,
      bookings,
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
