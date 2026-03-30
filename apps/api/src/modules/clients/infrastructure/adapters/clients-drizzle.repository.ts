import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as client from 'src/modules/db/client';
import {
  clientProfiles,
  clients,
  publicUserClients,
} from 'src/modules/db/schema';
import { eq, sql } from 'drizzle-orm';

import {
  ClientsRepository,
  CreateClientInput,
  PublicClient,
  UpdateClientInput,
} from '../../core/ports/clients.repository';
import {
  Client,
  ClientDetails,
  ClientEditData,
  OrganizationClientListItem,
} from '../../core/entities/client.entity';
import { ClientMapper } from '../mappers/client.mapper';

@Injectable()
export class ClientsDrizzleRepository implements ClientsRepository {
  constructor(@Inject('DB') private db: client.DB) {}

  async findAll(): Promise<Client[]> {
    const rows = await this.db.select().from(clients);
    return rows.map((row) => ClientMapper.toDomain(row));
  }

  async findOne(id: string): Promise<ClientDetails> {
    const clientRow = await this.db.query.clients.findFirst({
      where: eq(clients.id, id),
    });

    if (!clientRow) throw new BadRequestException('Client not found');

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
        (statsRow?.ratingCount ?? 0) > 0
          ? Number(statsRow?.averageRating)
          : null,
    };

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
        a."end",
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

    const apptsByBookingId = new Map<
      string,
      Array<{
        id: string;
        start: string;
        end: string;
        status: string;
        priceCents: number | null;
        staff: {
          id: string;
          name: string;
          avatarUrl: string | null;
          jobRole: string | null;
        };
        service: {
          id: string;
          name: string;
          durationMin: number;
          priceCents: number;
        };
        publicUser: {
          id: string;
          name: string | null;
          email: string | null;
          avatarUrl: string | null;
        } | null;
      }>
    >();

    for (const a of appointmentsRaw) {
      if (!a.publicBookingId) continue;

      const item = {
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
      };

      const arr = apptsByBookingId.get(a.publicBookingId) ?? [];
      arr.push(item);
      apptsByBookingId.set(a.publicBookingId, arr);
    }

    const bookings = bookingsRaw.map((b) => ({
      ...b,
      appointments: apptsByBookingId.get(b.id) ?? [],
    }));

    const reviewsFlat = await this.db.execute<{
      id: string;
      rating: number;
      comment: string | null;
      createdAt: string;
      bookingId: string;
      branchId: string;
      branchName: string;
      staffId: string | null;
      staffName: string | null;
      staffAvatarUrl: string | null;
    }>(sql`
      SELECT
        pbr.id,
        pbr.rating,
        pbr.comment,
        pbr.created_at as "createdAt",
        pbr.booking_id as "bookingId",

        b.id as "branchId",
        b.name as "branchName",

        s.id as "staffId",
        s.name as "staffName",
        s.avatar_url as "staffAvatarUrl"

      FROM public_booking_ratings pbr
      JOIN public_bookings pb ON pb.id = pbr.booking_id
      JOIN branches b ON b.id = pb.branch_id
      JOIN appointments a ON a.public_booking_id = pb.id

      LEFT JOIN public_booking_rating_staff pbrs
        ON pbrs.rating_id = pbr.id
      LEFT JOIN staff s
        ON s.id = pbrs.staff_id

      WHERE a.client_id = ${id}
      ORDER BY pbr.created_at DESC
    `);

    type ReviewAgg = {
      id: string;
      rating: number;
      comment: string | null;
      createdAt: string;
      bookingId: string;
      branchId: string;
      branchName: string;
      staff: { id: string; name: string; avatarUrl: string | null }[];
    };

    const reviewsMap = new Map<string, ReviewAgg>();

    for (const row of reviewsFlat) {
      let agg = reviewsMap.get(row.id);

      if (!agg) {
        agg = {
          id: row.id,
          rating: row.rating,
          comment: row.comment ?? null,
          createdAt: row.createdAt,
          bookingId: row.bookingId,
          branchId: row.branchId,
          branchName: row.branchName,
          staff: [],
        };
        reviewsMap.set(row.id, agg);
      }

      if (row.staffId) {
        const exists = agg.staff.some((s) => s.id === row.staffId);
        if (!exists) {
          agg.staff.push({
            id: row.staffId,
            name: row.staffName ?? 'Staff',
            avatarUrl: row.staffAvatarUrl ?? null,
          });
        }
      }
    }

    const reviews = Array.from(reviewsMap.values()).map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      bookingId: r.bookingId,
      branchId: r.branchId,
      branchName: r.branchName,
      staff: r.staff.length ? r.staff : [],
    }));

    return {
      client: {
        id: clientRow.id,
        name: clientRow.name ?? null,
        email: clientRow.email ?? null,
        phone: clientRow.phone ?? null,
        avatarUrl: clientRow.avatarUrl ?? null,
        createdAt: clientRow.createdAt?.toISOString?.() ?? null,
      },
      stats,
      bookings,
      reviews,
    };
  }

  async create(dto: CreateClientInput): Promise<Client> {
    const { profile, ...clientData } = dto;

    const [c] = await this.db.insert(clients).values(clientData).returning();

    await this.db.insert(clientProfiles).values({
      clientId: c.id,

      gender: profile?.gender ?? null,
      occupation: profile?.occupation ?? null,
      city: profile?.city ?? null,
      ageRange: profile?.ageRange ?? null,
      preferredStaffId: profile?.preferredStaffId ?? null,
      marketingOptIn: profile?.marketingOptIn ?? false,
    });

    return ClientMapper.toDomain(c);
  }

  async update(id: string, dto: UpdateClientInput): Promise<Client> {
    const { profile, ...clientData } = dto;

    await this.db.transaction(async (tx) => {
      const cleanClientData = Object.fromEntries(
        Object.entries(clientData).filter(([, v]) => v != null),
      );

      if (Object.keys(cleanClientData).length > 0) {
        await tx.update(clients).set(cleanClientData).where(eq(clients.id, id));
      }

      if (profile) {
        const cleanProfile = Object.fromEntries(
          Object.entries(profile).filter(([, v]) => v != null),
        );

        if (Object.keys(cleanProfile).length > 0) {
          await tx
            .insert(clientProfiles)
            .values({
              clientId: id,
              ...cleanProfile,
            })
            .onConflictDoUpdate({
              target: clientProfiles.clientId,
              set: cleanProfile,
            });
        }
      }
    });

    const updated = await this.db.query.clients.findFirst({
      where: eq(clients.id, id),
      with: {
        profile: true,
      },
    });

    return {
      ...ClientMapper.toDomain(updated!),
      profile: updated?.profile ?? null,
    };
  }

  async findByOrganization(
    organizationId: string,
  ): Promise<OrganizationClientListItem[]> {
    const rows = await this.db.execute<OrganizationClientListItem>(sql`
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

  async findEditData(id: string): Promise<ClientEditData> {
    const client = await this.db.query.clients.findFirst({
      where: eq(clients.id, id),
      with: {
        publicUsers: true,
      },
    });

    const profile = await this.db.query.clientProfiles.findFirst({
      where: eq(clientProfiles.clientId, id),
    });

    const linkedToPublicUser = (client?.publicUsers?.length ?? 0) > 0;

    return {
      id: client!.id,

      name: client!.name,
      email: client!.email,
      phone: client!.phone,
      avatarUrl: client!.avatarUrl,
      birthdate: client!.birthdate,

      profile: profile
        ? {
            gender: profile.gender,
            occupation: profile.occupation,
            city: profile.city,
            ageRange: profile.ageRange,
            preferredStaffId: profile.preferredStaffId,
            marketingOptIn: profile.marketingOptIn,
          }
        : undefined,

      editable: {
        name: !linkedToPublicUser,
        email: !linkedToPublicUser,
        phone: !linkedToPublicUser,
      },
    };
  }

  async delete(id: string): Promise<{ ok: true }> {
    const res = await this.db.transaction(async (tx) => {
      // borrar profile si existe
      await tx.delete(clientProfiles).where(eq(clientProfiles.clientId, id));

      // borrar cliente
      const deleted = await tx
        .delete(clients)
        .where(eq(clients.id, id))
        .returning();

      return deleted;
    });

    if (!res || res.length === 0) {
      throw new BadRequestException('Client not found');
    }

    return { ok: true };
  }

  async findPublicClientsByOrganization(
    orgId: string,
  ): Promise<PublicClient[]> {
    const rows = await this.db
      .select({
        id: clients.id,
        name: clients.name,
        email: clients.email,
        phone: clients.phone,
        avatarUrl: clients.avatarUrl,
        publicUserId: publicUserClients.publicUserId,
      })
      .from(clients)
      .innerJoin(publicUserClients, eq(publicUserClients.clientId, clients.id))
      .where(eq(clients.organizationId, orgId));

    return rows;
  }
}
