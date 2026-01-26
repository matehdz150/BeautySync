/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomUUID } from 'crypto';
import { DateTime } from 'luxon';
import { and, eq, gt, inArray, lt } from 'drizzle-orm';

import * as client from 'src/modules/db/client';

import {
  appointmentStatusHistory,
  appointments,
  branchSettings,
  branches,
  clients,
  publicBookings,
  publicUserClients,
  publicUsers,
  services,
  staff,
} from 'src/modules/db/schema';

import { CreatePublicBookingDto } from './dto/create-booking-public.dto';
import { PublicBookingJobsService } from '../queues/booking/public-booking-job.service';

@Injectable()
export class BookingsCoreService {
  constructor(
    private readonly publicBookingJobsService: PublicBookingJobsService,
    @Inject('DB') private readonly db: client.DB,
  ) {}

  async createPublicBooking(dto: CreatePublicBookingDto, publicUserId: string) {
    async function getOrCreateClientForPublicUser(params: {
      tx: any;
      publicUser: typeof publicUsers.$inferSelect;
      branch: typeof branches.$inferSelect;
    }) {
      const { tx, publicUser, branch } = params;

      const existingLink = await tx.query.publicUserClients.findFirst({
        where: eq(publicUserClients.publicUserId, publicUser.id),
        with: { client: true },
      });

      if (existingLink?.client?.organizationId === branch.organizationId) {
        return existingLink.client.id;
      }

      const [createdClient] = await tx
        .insert(clients)
        .values({
          organizationId: branch.organizationId,
          name: publicUser.name ?? 'Cliente',
          email: publicUser.email ?? null,
          phone: publicUser.phoneE164 ?? null,
          avatarUrl: publicUser.avatarUrl ?? null,
        })
        .returning({ id: clients.id });

      await tx.insert(publicUserClients).values({
        publicUserId: publicUser.id,
        clientId: createdClient.id,
      });

      return createdClient.id;
    }

    const { branchSlug, appointments: drafts } = dto;

    if (!drafts?.length) {
      throw new BadRequestException('appointments is required');
    }

    const publicUser = await this.db.query.publicUsers.findFirst({
      where: eq(publicUsers.id, publicUserId),
    });

    if (!publicUser) {
      throw new ForbiddenException('Public user not found');
    }

    if (!publicUser.phoneE164 || publicUser.phoneE164.trim().length < 8) {
      throw new ForbiddenException({
        code: 'PHONE_REQUIRED',
        message: 'Phone number is required to create an appointment',
      });
    }

    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.publicSlug, branchSlug),
    });

    if (!branch) throw new NotFoundException('Branch not found');
    if (!branch.publicPresenceEnabled) {
      throw new ForbiddenException('Branch is not public');
    }

    const settings = await this.db.query.branchSettings.findFirst({
      where: eq(branchSettings.branchId, branch.id),
    });

    const tz = settings?.timezone ?? 'America/Mexico_City';
    const bufferBefore = settings?.bufferBeforeMin ?? 0;
    const bufferAfter = settings?.bufferAfterMin ?? 0;

    const BLOCK_MINUTES = 15;

    if (drafts.some((a) => a.staffId === 'ANY')) {
      throw new BadRequestException(
        'staffId cannot be ANY in final booking payload',
      );
    }

    const bookingId = randomUUID();

    const normalized = await Promise.all(
      drafts.map(async (a) => {
        const service = await this.db.query.services.findFirst({
          where: and(
            eq(services.id, a.serviceId),
            eq(services.branchId, branch.id),
            eq(services.isActive, true),
          ),
        });

        if (!service) {
          throw new BadRequestException(`Service not found: ${a.serviceId}`);
        }

        const startLocal = DateTime.fromISO(a.startIso).set({
          millisecond: 0,
          second: 0,
        });

        if (!startLocal.isValid) {
          throw new BadRequestException('Invalid startIso');
        }

        const startInBranchTz = startLocal.setZone(tz);
        if (startInBranchTz.toISODate() !== dto.date) {
          throw new BadRequestException(
            `startIso does not match date ${dto.date}`,
          );
        }

        const totalMinutes = service.durationMin + bufferBefore + bufferAfter;
        const roundedMinutes =
          Math.ceil(totalMinutes / BLOCK_MINUTES) * BLOCK_MINUTES;

        const startUtc = startLocal.toUTC();
        const endUtc = startUtc.plus({ minutes: roundedMinutes }).set({
          millisecond: 0,
          second: 0,
        });

        return {
          publicBookingId: bookingId,
          branchId: branch.id,
          serviceId: service.id,
          staffId: a.staffId,
          startUtc,
          endUtc,
          priceCents: service.priceCents,
          notes: dto.notes ?? null,
        };
      }),
    );

    normalized.sort((x, y) =>
      x.startUtc.toISO()!.localeCompare(y.startUtc.toISO()),
    );

    for (let i = 1; i < normalized.length; i++) {
      const prev = normalized[i - 1];
      const curr = normalized[i];

      if (prev.endUtc.toISO() !== curr.startUtc.toISO()) {
        throw new BadRequestException(
          'appointments must be consecutive without gaps',
        );
      }
    }

    const bookingStartsAtUtc = normalized[0].startUtc.toJSDate();
    const bookingEndsAtUtc =
      normalized[normalized.length - 1].endUtc.toJSDate();
    const bookingTotalCents = normalized.reduce(
      (acc, a) => acc + (a.priceCents ?? 0),
      0,
    );

    // =========================
    // ✅ TRANSACTION (DB ONLY)
    // =========================
    const result = await this.db.transaction(async (tx) => {
      const clientId = await getOrCreateClientForPublicUser({
        tx,
        publicUser,
        branch,
      });

      for (const a of normalized) {
        const overlapping = await tx
          .select()
          .from(appointments)
          .where(
            and(
              eq(appointments.branchId, a.branchId),
              eq(appointments.staffId, a.staffId),
              lt(appointments.start, a.endUtc.toJSDate()),
              gt(appointments.end, a.startUtc.toJSDate()),
            ),
          );

        if (overlapping.length > 0) {
          throw new BadRequestException('Timeslot already booked');
        }
      }

      await tx.insert(publicBookings).values({
        id: bookingId,
        branchId: branch.id,
        publicUserId,
        startsAt: bookingStartsAtUtc,
        endsAt: bookingEndsAtUtc,
        status: 'CONFIRMED',
        paymentMethod: (dto.paymentMethod ?? 'ONSITE') as 'ONSITE' | 'ONLINE',
        totalCents: bookingTotalCents,
        notes: dto.notes ?? null,
      });

      const created = await Promise.all(
        normalized.map(async (a) => {
          const [row] = await tx
            .insert(appointments)
            .values({
              publicBookingId: a.publicBookingId,
              publicUserId,
              clientId,
              branchId: a.branchId,
              staffId: a.staffId,
              serviceId: a.serviceId,
              start: a.startUtc.toJSDate(),
              end: a.endUtc.toJSDate(),
              status: 'CONFIRMED',
              // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
              paymentStatus: dto.paymentMethod === 'ONLINE' ? 'PAID' : 'UNPAID',
              notes: a.notes,
              priceCents: a.priceCents,
            })
            .returning();

          await tx.insert(appointmentStatusHistory).values({
            appointmentId: row.id,
            newStatus: 'CONFIRMED',
            reason: 'Public booking',
          });

          return row;
        }),
      );

      return {
        ok: true,
        bookingId,
        branchSlug: dto.branchSlug,
        date: dto.date,
        paymentMethod: dto.paymentMethod,
        discountCode: dto.discountCode ?? null,
        notes: dto.notes ?? null,
        clientId,
        appointments: created,
      };
    });

    // =========================
    // ✅ OUTSIDE TRANSACTION
    // =========================
    await this.publicBookingJobsService.scheduleBookingLifecycle({
      bookingId,
      startsAtUtc: bookingStartsAtUtc,
      endsAtUtc: bookingEndsAtUtc,
    });

    return result;
  }

  async getPublicBookingById(params: {
    bookingId: string;
    publicUserId: string;
  }) {
    const { bookingId, publicUserId } = params;

    if (!bookingId) throw new BadRequestException('bookingId is required');
    if (!publicUserId) throw new ForbiddenException('Not authenticated');

    // ✅ 0) Traer booking (source of truth)
    const booking = await this.db.query.publicBookings.findFirst({
      where: and(
        eq(publicBookings.id, bookingId),
        eq(publicBookings.publicUserId, publicUserId),
      ),
    });

    if (!booking) {
      // same message para no filtrar info
      throw new NotFoundException('Booking not found');
    }

    // 1) Traer appointments del booking
    const rows = await this.db.query.appointments.findMany({
      where: eq(appointments.publicBookingId, bookingId),
    });

    if (!rows.length) {
      throw new NotFoundException('Booking not found');
    }

    // (defensivo) ownership check extra
    if (rows.some((r) => r.publicUserId !== publicUserId)) {
      throw new NotFoundException('Booking not found');
    }

    // 2) Branch
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.id, booking.branchId),
      with: { images: true },
    });

    if (!branch) throw new NotFoundException('Branch not found');
    if (!branch.publicPresenceEnabled) {
      throw new ForbiddenException('Branch is not public');
    }

    // 3) Settings (timezone)
    const settings = await this.db.query.branchSettings.findFirst({
      where: eq(branchSettings.branchId, branch.id),
    });

    const tz = settings?.timezone ?? 'America/Mexico_City';

    // 4) cargar services y staff de los appointments
    const serviceIds = Array.from(new Set(rows.map((r) => r.serviceId)));
    const staffIds = Array.from(new Set(rows.map((r) => r.staffId)));

    const servicesRows = await this.db.query.services.findMany({
      where: inArray(services.id, serviceIds),
    });

    const staffRows = await this.db.query.staff.findMany({
      where: inArray(staff.id, staffIds),
    });

    const servicesMap = new Map(servicesRows.map((s) => [s.id, s]));
    const staffMap = new Map(staffRows.map((s) => [s.id, s]));

    // 5) ordenar appointments por start
    const ordered = [...rows].sort((a, b) => {
      const aIso = new Date(a.start).toISOString();
      const bIso = new Date(b.start).toISOString();
      return aIso.localeCompare(bIso);
    });

    // 6) construir payload appointments (con ISO local en tz)
    const appointmentPayload = ordered.map((a) => {
      const srv = servicesMap.get(a.serviceId);
      const st = staffMap.get(a.staffId);

      const startUtc = DateTime.fromJSDate(a.start, { zone: 'utc' });
      const endUtc = DateTime.fromJSDate(a.end, { zone: 'utc' });

      return {
        id: a.id,
        status: a.status,

        startIso: startUtc.setZone(tz).toISO()!,
        endIso: endUtc.setZone(tz).toISO()!,

        durationMin: Math.round(endUtc.diff(startUtc, 'minutes').minutes),

        priceCents: a.priceCents ?? srv?.priceCents ?? 0,

        service: {
          id: srv?.id ?? a.serviceId,
          name: srv?.name ?? 'Servicio',
        },

        staff: st
          ? {
              id: st.id,
              name: st.name,
              avatarUrl: st.avatarUrl ?? null,
            }
          : {
              id: a.staffId,
              name: 'Staff',
              avatarUrl: null,
            },
      };
    });

    // 7) cover
    const coverUrl =
      branch.images?.find((img) => img.isCover)?.url ??
      branch.images?.[0]?.url ??
      null;

    // 8) date del booking usando startsAt del booking (source of truth)
    const bookingDate = DateTime.fromJSDate(booking.startsAt, { zone: 'utc' })
      .setZone(tz)
      .toISODate();

    return {
      ok: true,
      booking: {
        id: bookingId,

        status: booking.status, // ✅ viene de public_bookings
        startsAtISO: DateTime.fromJSDate(booking.startsAt, {
          zone: 'utc',
        }).toISO()!,
        endsAtISO: DateTime.fromJSDate(booking.endsAt, {
          zone: 'utc',
        }).toISO()!,

        branch: {
          id: branch.id,
          slug: branch.publicSlug,
          name: branch.name,
          address: branch.address ?? '',
          imageUrl: coverUrl,
        },

        date: bookingDate,

        paymentMethod: booking.paymentMethod, // ✅ source of truth
        notes: booking.notes ?? null, // ✅ source of truth

        totalCents: booking.totalCents, // ✅ source of truth
        appointments: appointmentPayload,
      },
    };
  }

  async setPhone(params: { publicUserId: string; phoneE164: string }) {
    const { publicUserId, phoneE164 } = params;

    if (!phoneE164 || !phoneE164.startsWith('+')) {
      throw new BadRequestException(
        'phoneE164 must be in E.164 format, example: +5213312345678',
      );
    }

    await this.db
      .update(publicUsers)
      .set({ phoneE164 })
      .where(eq(publicUsers.id, publicUserId));

    return { ok: true };
  }
  //manager
  async createManagerBooking(dto: {
    branchId: string;
    clientId?: string | null;
    date: string;
    notes?: string | null;
    appointments: {
      serviceId: string;
      staffId: string;
      startIso: string;
    }[];
  }) {
    const { branchId, clientId, appointments: drafts } = dto;

    if (!branchId) throw new BadRequestException('branchId is required');
    if (!drafts?.length)
      throw new BadRequestException('appointments is required');

    // 1) Branch
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    });

    if (!branch) throw new NotFoundException('Branch not found');

    // 2) Settings
    const settings = await this.db.query.branchSettings.findFirst({
      where: eq(branchSettings.branchId, branch.id),
    });

    const tz = settings?.timezone ?? 'America/Mexico_City';
    const bufferBefore = settings?.bufferBeforeMin ?? 0;
    const bufferAfter = settings?.bufferAfterMin ?? 0;

    const BLOCK_MINUTES = 15;

    // 3) Normalizar appointments (igual que public)
    const normalized = await Promise.all(
      drafts.map(async (a) => {
        const service = await this.db.query.services.findFirst({
          where: and(
            eq(services.id, a.serviceId),
            eq(services.branchId, branch.id),
            eq(services.isActive, true),
          ),
        });

        if (!service) {
          throw new BadRequestException(`Service not found: ${a.serviceId}`);
        }

        const startLocal = DateTime.fromISO(a.startIso).set({
          millisecond: 0,
          second: 0,
        });

        if (!startLocal.isValid) {
          throw new BadRequestException('Invalid startIso');
        }

        const startInBranchTz = startLocal.setZone(tz);
        if (startInBranchTz.toISODate() !== dto.date) {
          throw new BadRequestException(
            `startIso does not match date ${dto.date}`,
          );
        }

        const totalMinutes = service.durationMin + bufferBefore + bufferAfter;
        const roundedMinutes =
          Math.ceil(totalMinutes / BLOCK_MINUTES) * BLOCK_MINUTES;

        const startUtc = startLocal.toUTC();
        const endUtc = startUtc.plus({ minutes: roundedMinutes }).set({
          millisecond: 0,
          second: 0,
        });

        return {
          branchId: branch.id,
          serviceId: service.id,
          staffId: a.staffId,
          startUtc,
          endUtc,
          priceCents: service.priceCents,
        };
      }),
    );

    normalized.sort((x, y) =>
      x.startUtc.toISO()!.localeCompare(y.startUtc.toISO()),
    );

    for (let i = 1; i < normalized.length; i++) {
      const prev = normalized[i - 1];
      const curr = normalized[i];

      if (prev.endUtc.toISO() !== curr.startUtc.toISO()) {
        throw new BadRequestException(
          'appointments must be consecutive without gaps',
        );
      }
    }

    const bookingStartsAtUtc = normalized[0].startUtc.toJSDate();
    const bookingEndsAtUtc =
      normalized[normalized.length - 1].endUtc.toJSDate();
    const bookingTotalCents = normalized.reduce(
      (acc, a) => acc + (a.priceCents ?? 0),
      0,
    );

    // =========================
    // ✅ TRANSACTION
    // =========================
    const result = await this.db.transaction(async (tx) => {
      // A) Overlap check
      for (const a of normalized) {
        const overlapping = await tx
          .select()
          .from(appointments)
          .where(
            and(
              eq(appointments.branchId, a.branchId),
              eq(appointments.staffId, a.staffId),
              lt(appointments.start, a.endUtc.toJSDate()),
              gt(appointments.end, a.startUtc.toJSDate()),
            ),
          );

        if (overlapping.length > 0) {
          throw new BadRequestException('Timeslot already booked');
        }
      }

      // B) Resolver publicUserId si hay clientId
      let publicUserId: string | null = null;

      if (clientId) {
        const link = await tx.query.publicUserClients.findFirst({
          where: eq(publicUserClients.clientId, clientId),
          columns: { publicUserId: true },
        });

        publicUserId = link?.publicUserId ?? null;
      }

      // C) Crear publicBooking solo si hay publicUserId
      let publicBookingId: string | null = null;

      if (publicUserId) {
        publicBookingId = randomUUID();

        await tx.insert(publicBookings).values({
          id: publicBookingId,
          branchId: branch.id,
          publicUserId,
          startsAt: bookingStartsAtUtc,
          endsAt: bookingEndsAtUtc,
          status: 'CONFIRMED',
          paymentMethod: 'ONSITE',
          totalCents: bookingTotalCents,
          notes: dto.notes ?? null,
        });
      }

      // D) Insert appointments
      const created = await Promise.all(
        normalized.map(async (a) => {
          const [row] = await tx
            .insert(appointments)
            .values({
              branchId: a.branchId,
              staffId: a.staffId,
              serviceId: a.serviceId,
              start: a.startUtc.toJSDate(),
              end: a.endUtc.toJSDate(),
              status: 'CONFIRMED',
              paymentStatus: 'UNPAID',
              priceCents: a.priceCents,
              notes: dto.notes ?? null,

              clientId: clientId ?? null,
              publicUserId: publicUserId,
              publicBookingId: publicBookingId,
            })
            .returning();

          await tx.insert(appointmentStatusHistory).values({
            appointmentId: row.id,
            newStatus: 'CONFIRMED',
            reason: 'Manager booking',
          });

          return row;
        }),
      );

      return {
        ok: true,
        bookingId: publicBookingId ?? null, // ojo: esto es publicBookingId
        publicBookingId,
        publicUserId,
        clientId: clientId ?? null,
        appointments: created,
      };
    });

    // Jobs solo si existe publicBooking
    if (result.publicBookingId) {
      await this.publicBookingJobsService.scheduleBookingLifecycle({
        bookingId: result.publicBookingId,
        startsAtUtc: bookingStartsAtUtc,
        endsAtUtc: bookingEndsAtUtc,
      });
    }

    return result;
  }
}
