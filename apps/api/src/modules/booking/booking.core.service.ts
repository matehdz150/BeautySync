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
import { and, eq, inArray } from 'drizzle-orm';

import * as client from 'src/modules/db/client';

import {
  BookingRescheduleReason,
  appointmentStatusHistory,
  appointments,
  bookingReschedules,
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

import { buildAppointmentOverlapWhere } from '../lib/booking/booking.overlap';

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
            buildAppointmentOverlapWhere({
              branchId: a.branchId,
              staffId: a.staffId,
              startUtc: a.startUtc,
              endUtc: a.endUtc,
            }),
          );

        if (overlapping.length) {
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

    // 3) Normalizar appointments
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

    normalized.sort((a, b) =>
      a.startUtc.toISO()!.localeCompare(b.startUtc.toISO()),
    );

    for (let i = 1; i < normalized.length; i++) {
      if (normalized[i - 1].endUtc.toISO() !== normalized[i].startUtc.toISO()) {
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

    // 🔑 BOOKING ID SIEMPRE
    const bookingId = randomUUID();

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
            buildAppointmentOverlapWhere({
              branchId: a.branchId,
              staffId: a.staffId,
              startUtc: a.startUtc,
              endUtc: a.endUtc,
            }),
          );

        if (overlapping.length) {
          throw new BadRequestException('Timeslot already booked');
        }
      }

      // B) Resolver publicUserId (puede ser null)
      let publicUserId: string | null = null;
      if (clientId) {
        const link = await tx.query.publicUserClients.findFirst({
          where: eq(publicUserClients.clientId, clientId),
          columns: { publicUserId: true },
        });
        publicUserId = link?.publicUserId ?? null;
      }

      // C) 👉 CREAR BOOKING SIEMPRE
      await tx.insert(publicBookings).values({
        id: bookingId,
        branchId: branch.id,
        publicUserId, // 👈 nullable
        startsAt: bookingStartsAtUtc,
        endsAt: bookingEndsAtUtc,
        status: 'CONFIRMED',
        paymentMethod: 'ONSITE',
        totalCents: bookingTotalCents,
        notes: dto.notes ?? null,
      });

      // D) Insert appointments (siempre con bookingId)
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
              publicUserId,
              publicBookingId: bookingId, // ✅ SIEMPRE
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
        bookingId,
        publicBookingId: bookingId,
        publicUserId,
        clientId: clientId ?? null,
        appointments: created,
      };
    });

    // ⏱ Jobs SOLO si hay usuario público ligado
    if (result.publicUserId) {
      await this.publicBookingJobsService.scheduleBookingLifecycle({
        bookingId,
        startsAtUtc: bookingStartsAtUtc,
        endsAtUtc: bookingEndsAtUtc,
      });
    }

    return result;
  }

  private roundToBlock(totalMinutes: number, blockMinutes = 15) {
    return Math.ceil(totalMinutes / blockMinutes) * blockMinutes;
  }

  private async getBranchAndSettings(branchId: string) {
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    });

    if (!branch) throw new NotFoundException('Branch not found');

    const settings = await this.db.query.branchSettings.findFirst({
      where: eq(branchSettings.branchId, branch.id),
    });

    const tz = settings?.timezone ?? 'America/Mexico_City';
    const bufferBefore = settings?.bufferBeforeMin ?? 0;
    const bufferAfter = settings?.bufferAfterMin ?? 0;

    return { branch, settings, tz, bufferBefore, bufferAfter };
  }

  private async hasOverlap(params: {
    branchId: string;
    staffId: string;
    startUtc: DateTime;
    endUtc: DateTime;
  }) {
    const overlapping = await this.db
      .select({ id: appointments.id })
      .from(appointments)
      .where(buildAppointmentOverlapWhere(params));

    return overlapping.length > 0;
  }

  private async computeSegment(params: {
    branchId: string;
    tz: string;
    bufferBefore: number;
    bufferAfter: number;
    startUtc: DateTime;
    serviceId: string;
  }) {
    const { branchId, bufferBefore, bufferAfter, startUtc, serviceId } = params;

    const srv = await this.db.query.services.findFirst({
      where: and(
        eq(services.id, serviceId),
        eq(services.branchId, branchId),
        eq(services.isActive, true),
      ),
    });

    if (!srv) throw new BadRequestException(`Service not found: ${serviceId}`);

    const total = srv.durationMin + bufferBefore + bufferAfter;
    const rounded = this.roundToBlock(total, 15);

    const endUtc = startUtc.plus({ minutes: rounded }).set({
      millisecond: 0,
      second: 0,
    });

    return {
      service: srv,
      startUtc,
      endUtc,
      durationMin: rounded,
      priceCents: srv.priceCents ?? 0,
    };
  }

  async managerChainBuild(dto: {
    branchId: string;
    date: string;
    pinnedStartIso: string;
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    chain: { serviceId: string; staffId: string | 'ANY' }[];
  }) {
    const { branchId, date, pinnedStartIso, chain } = dto;

    if (!branchId) throw new BadRequestException('branchId is required');
    if (!date) throw new BadRequestException('date is required');
    if (!pinnedStartIso)
      throw new BadRequestException('pinnedStartIso is required');
    if (!chain?.length) throw new BadRequestException('chain is required');

    const { branch, tz, bufferBefore, bufferAfter } =
      await this.getBranchAndSettings(branchId);

    const pinnedLocal = DateTime.fromISO(pinnedStartIso).set({
      millisecond: 0,
      second: 0,
    });

    if (!pinnedLocal.isValid) {
      throw new BadRequestException('Invalid pinnedStartIso');
    }

    const pinnedInTz = pinnedLocal.setZone(tz);
    if (pinnedInTz.toISODate() !== date) {
      throw new BadRequestException(
        `pinnedStartIso does not match date ${date}`,
      );
    }

    let cursorUtc = pinnedLocal.toUTC();

    const assignments: {
      serviceId: string;
      staffId: string;
      startUtc: DateTime;
      endUtc: DateTime;
      durationMin: number;
      priceCents: number;
    }[] = [];

    for (const item of chain) {
      const seg = await this.computeSegment({
        branchId: branch.id,
        tz,
        bufferBefore,
        bufferAfter,
        startUtc: cursorUtc,
        serviceId: item.serviceId,
      });

      // Resolver staff final
      let finalStaffId: string;

      if (item.staffId === 'ANY') {
        const candidates = await this.db.query.staff.findMany({
          where: and(eq(staff.branchId, branch.id), eq(staff.isActive, true)),
          columns: { id: true },
        });

        if (!candidates.length) {
          throw new BadRequestException('No staff available in branch');
        }

        const available: string[] = [];
        for (const s of candidates) {
          const overlap = await this.hasOverlap({
            branchId: branch.id,
            staffId: s.id,
            startUtc: seg.startUtc,
            endUtc: seg.endUtc,
          });
          if (!overlap) available.push(s.id);
        }

        if (!available.length) {
          throw new BadRequestException('No staff available for this timeslot');
        }

        finalStaffId = available[0];
      } else {
        finalStaffId = item.staffId;

        const overlap = await this.hasOverlap({
          branchId: branch.id,
          staffId: finalStaffId,
          startUtc: seg.startUtc,
          endUtc: seg.endUtc,
        });

        if (overlap) {
          throw new BadRequestException('Timeslot already booked');
        }
      }

      assignments.push({
        serviceId: seg.service.id,
        staffId: finalStaffId,
        startUtc: seg.startUtc,
        endUtc: seg.endUtc,
        durationMin: seg.durationMin,
        priceCents: seg.priceCents,
      });

      cursorUtc = seg.endUtc;
    }

    const totalMinutes = assignments.reduce((acc, a) => acc + a.durationMin, 0);
    const totalCents = assignments.reduce(
      (acc, a) => acc + (a.priceCents ?? 0),
      0,
    );

    return {
      ok: true,
      plan: {
        startIso: assignments[0].startUtc.toISO()!,
        assignments: assignments.map((a) => ({
          serviceId: a.serviceId,
          staffId: a.staffId,
          startIso: a.startUtc.toISO()!,
          endIso: a.endUtc.toISO()!,
          durationMin: a.durationMin,
          priceCents: a.priceCents,
        })),
        totalMinutes,
        totalCents,
      },
    };
  }

  async managerChainNextServices(dto: {
    branchId: string;
    date: string;
    pinnedStartIso: string;
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    chain: { serviceId: string; staffId: string | 'ANY' }[];
  }) {
    const { branchId } = dto;

    if (!branchId) throw new BadRequestException('branchId is required');

    const { branch } = await this.getBranchAndSettings(branchId);

    const activeServices = await this.db.query.services.findMany({
      where: and(eq(services.branchId, branch.id), eq(services.isActive, true)),
      with: {
        category: true,
      },
    });

    const possible: {
      id: string;
      name: string;
      durationMin: number;
      priceCents: number;
      categoryColor: string | null;
    }[] = [];

    for (const srv of activeServices) {
      try {
        await this.managerChainBuild({
          ...dto,
          chain: [...dto.chain, { serviceId: srv.id, staffId: 'ANY' }],
        });

        possible.push({
          id: srv.id,
          name: srv.name,
          durationMin: srv.durationMin,
          priceCents: srv.priceCents ?? 0,
          categoryColor: srv.category?.colorHex ?? null,
        });
      } catch {
        // si falla, no se incluye
      }
    }

    return { ok: true, nextServices: possible };
  }

  async managerChainNextStaffOptions(dto: {
    branchId: string;
    date: string;
    pinnedStartIso: string;
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    chain: { serviceId: string; staffId: string | 'ANY' }[];
    nextServiceId: string;
  }) {
    const { branchId, nextServiceId } = dto;

    if (!branchId) throw new BadRequestException('branchId is required');
    if (!nextServiceId)
      throw new BadRequestException('nextServiceId is required');

    const { branch, tz, bufferBefore, bufferAfter } =
      await this.getBranchAndSettings(branchId);

    // plan parcial para saber cursor (end)
    const partial =
      dto.chain.length > 0
        ? await this.managerChainBuild({
            branchId: dto.branchId,
            date: dto.date,
            pinnedStartIso: dto.pinnedStartIso,
            chain: dto.chain,
          })
        : null;

    const cursorStartIso = partial?.plan.assignments.length
      ? partial.plan.assignments[partial.plan.assignments.length - 1].endIso
      : DateTime.fromISO(dto.pinnedStartIso).toUTC().toISO()!;

    const startUtc = DateTime.fromISO(cursorStartIso).toUTC();

    const seg = await this.computeSegment({
      branchId: branch.id,
      tz,
      bufferBefore,
      bufferAfter,
      startUtc,
      serviceId: nextServiceId,
    });

    const staffRows = await this.db.query.staff.findMany({
      where: and(eq(staff.branchId, branch.id), eq(staff.isActive, true)),
      columns: { id: true, name: true, avatarUrl: true },
    });

    const available: { id: string; name: string; avatarUrl?: string | null }[] =
      [];

    for (const s of staffRows) {
      const overlap = await this.hasOverlap({
        branchId: branch.id,
        staffId: s.id,
        startUtc: seg.startUtc,
        endUtc: seg.endUtc,
      });

      if (!overlap) {
        available.push({
          id: s.id,
          name: s.name,
          avatarUrl: s.avatarUrl ?? null,
        });
      }
    }

    return {
      ok: true,
      allowAny: true,
      staff: available,
    };
  }

  async getManagerBookingById(params: { bookingId: string }) {
    const { bookingId } = params;

    if (!bookingId) {
      throw new BadRequestException('bookingId is required');
    }

    // 1) Appointments del booking
    const rows = await this.db.query.appointments.findMany({
      where: eq(appointments.publicBookingId, bookingId),
    });

    if (!rows.length) {
      throw new NotFoundException('Booking not found');
    }

    // 1.5) Booking (source of truth)
    const bookingRow = await this.db.query.publicBookings.findFirst({
      where: eq(publicBookings.id, bookingId),
    });

    if (!bookingRow) {
      throw new NotFoundException('Public booking not found');
    }

    // 2) Branch
    const branchId = rows[0].branchId;

    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    });

    if (!branch) throw new NotFoundException('Branch not found');

    // 3) Settings (timezone)
    const settings = await this.db.query.branchSettings.findFirst({
      where: eq(branchSettings.branchId, branch.id),
    });

    const tz = settings?.timezone ?? 'America/Mexico_City';

    // 4) Cliente (puede ser null)
    const clientId = rows[0].clientId;

    const clientRow = clientId
      ? await this.db.query.clients.findFirst({
          where: eq(clients.id, clientId),
          with: {
            publicUsers: {
              with: {
                publicUser: true,
              },
            },
          },
        })
      : null;

    // 🔑 resolver avatar del cliente
    const publicUserAvatar =
      clientRow?.publicUsers?.[0]?.publicUser?.avatarUrl ?? null;

    const clientAvatar = clientRow?.avatarUrl ?? publicUserAvatar ?? null;

    // 5) Services & Staff
    const serviceIds = Array.from(new Set(rows.map((r) => r.serviceId)));
    const staffIds = Array.from(new Set(rows.map((r) => r.staffId)));

    const servicesRows = await this.db.query.services.findMany({
      where: inArray(services.id, serviceIds),
      with: { category: true },
    });

    const staffRows = await this.db.query.staff.findMany({
      where: inArray(staff.id, staffIds),
    });

    const servicesMap = new Map(servicesRows.map((s) => [s.id, s]));
    const staffMap = new Map(staffRows.map((s) => [s.id, s]));

    // 6) Ordenar appointments
    const ordered = [...rows].sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    );

    // 7) Appointments payload
    const appointmentPayload = ordered.map((a) => {
      const srv = servicesMap.get(a.serviceId);
      const st = staffMap.get(a.staffId);

      const startUtc = DateTime.fromJSDate(a.start, { zone: 'utc' });
      const endUtc = DateTime.fromJSDate(a.end, { zone: 'utc' });

      return {
        id: a.id,
        status: a.status,
        paymentStatus: a.paymentStatus,

        startIso: startUtc.setZone(tz).toISO()!,
        endIso: endUtc.setZone(tz).toISO()!,

        durationMin: Math.round(endUtc.diff(startUtc, 'minutes').minutes),
        priceCents: a.priceCents ?? srv?.priceCents ?? 0,

        service: {
          id: srv?.id ?? a.serviceId,
          name: srv?.name ?? 'Servicio',
          categoryColor: srv?.category?.colorHex ?? '#A78BFA',
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

    // 8) Totales
    const bookingStartsAtUtc = ordered[0].start;
    const bookingEndsAtUtc = ordered[ordered.length - 1].end;

    const totalCents = ordered.reduce((acc, a) => acc + (a.priceCents ?? 0), 0);

    const bookingDate = DateTime.fromJSDate(bookingStartsAtUtc, { zone: 'utc' })
      .setZone(tz)
      .toISODate();

    // ✅ RESPONSE FINAL
    return {
      ok: true,
      booking: {
        id: bookingId,
        status: bookingRow.status,

        date: bookingDate,

        startsAtISO: DateTime.fromJSDate(bookingStartsAtUtc, {
          zone: 'utc',
        }).toISO()!,
        endsAtISO: DateTime.fromJSDate(bookingEndsAtUtc, {
          zone: 'utc',
        }).toISO()!,

        branch: {
          id: branch.id,
          name: branch.name,
        },

        client: clientRow
          ? {
              id: clientRow.id,
              name: clientRow.name,
              phone: clientRow.phone,
              email: clientRow.email,
              avatarUrl: clientAvatar, // 🔥 AQUÍ
            }
          : null,

        paymentStatus: ordered.every((a) => a.paymentStatus === 'PAID')
          ? 'PAID'
          : 'UNPAID',

        totalCents,
        appointments: appointmentPayload,
      },
    };
  }

  async assignClientToBooking(params: { bookingId: string; clientId: string }) {
    const { bookingId, clientId } = params;

    if (!bookingId) throw new BadRequestException('bookingId is required');
    if (!clientId) throw new BadRequestException('clientId is required');

    return this.db.transaction(async (tx) => {
      // 1) Booking
      const booking = await tx.query.publicBookings.findFirst({
        where: eq(publicBookings.id, bookingId),
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.publicUserId) {
        throw new BadRequestException(
          'Booking already has a public user assigned',
        );
      }

      // 2) Resolver publicUserId desde clientId
      const link = await tx.query.publicUserClients.findFirst({
        where: eq(publicUserClients.clientId, clientId),
        columns: { publicUserId: true },
      });

      if (!link?.publicUserId) {
        throw new BadRequestException(
          'Client is not linked to any public user',
        );
      }

      const publicUserId = link.publicUserId;

      // 3) Actualizar booking
      await tx
        .update(publicBookings)
        .set({ publicUserId })
        .where(eq(publicBookings.id, bookingId));

      // 4) Actualizar appointments
      await tx
        .update(appointments)
        .set({
          publicUserId,
          clientId,
        })
        .where(eq(appointments.publicBookingId, bookingId));

      // 5) Schedule jobs (🔥 AQUÍ es el único lugar)
      await this.publicBookingJobsService.scheduleBookingLifecycle({
        bookingId,
        startsAtUtc: booking.startsAt,
        endsAtUtc: booking.endsAt,
      });

      return {
        ok: true,
        bookingId,
        publicUserId,
        clientId,
      };
    });
  }

  async cancelBooking(params: {
    bookingId: string;
    cancelledBy: 'PUBLIC' | 'MANAGER';
    reason?: string;
  }) {
    const { bookingId, cancelledBy, reason } = params;

    if (!bookingId) {
      throw new BadRequestException('bookingId is required');
    }

    const nowUtc = DateTime.utc();

    // =========================
    // ✅ DB TRANSACTION ONLY
    // =========================
    const result = await this.db.transaction(async (tx) => {
      const booking = await tx.query.publicBookings.findFirst({
        where: eq(publicBookings.id, bookingId),
      });

      if (!booking) throw new NotFoundException('Booking not found');

      if (booking.status === 'CANCELLED') {
        throw new BadRequestException('Booking already cancelled');
      }

      if (booking.status === 'COMPLETED') {
        throw new BadRequestException('Completed booking cannot be cancelled');
      }

      const startsAtUtc = DateTime.fromJSDate(booking.startsAt, {
        zone: 'utc',
      });
      if (startsAtUtc <= nowUtc) {
        throw new BadRequestException(
          'Booking already started and cannot be cancelled',
        );
      }

      await tx
        .update(publicBookings)
        .set({ status: 'CANCELLED', updatedAt: new Date() })
        .where(eq(publicBookings.id, bookingId));

      const affectedAppointments = await tx
        .update(appointments)
        .set({ status: 'CANCELLED', updatedAt: new Date() })
        .where(eq(appointments.publicBookingId, bookingId))
        .returning({ id: appointments.id });

      for (const a of affectedAppointments) {
        await tx.insert(appointmentStatusHistory).values({
          appointmentId: a.id,
          newStatus: 'CANCELLED',
          reason:
            reason ??
            (cancelledBy === 'PUBLIC'
              ? 'Cancelled by client'
              : 'Cancelled by manager'),
        });
      }

      return {
        bookingId,
        cancelledBy,
        cancelledAppointments: affectedAppointments.length,
      };
    });

    // =========================
    // ✅ SIDE EFFECTS (OUTSIDE)
    // =========================
    await this.publicBookingJobsService.cancelScheduledJobs(bookingId);

    await this.publicBookingJobsService.scheduleCancellationMail({
      bookingId,
      cancelledBy,
    });

    return { ok: true, ...result };
  }

  async rescheduleBookingCore(params: {
    bookingId: string;
    newStartIso: string;
    rescheduledBy: 'PUBLIC' | 'MANAGER' | 'SYSTEM';
    publicUserId?: string | null;
    reason?: BookingRescheduleReason;
    notes?: string;
  }) {
    const {
      bookingId,
      newStartIso,
      rescheduledBy,
      publicUserId,
      reason,
      notes,
    } = params;

    if (!bookingId) throw new BadRequestException('bookingId is required');
    if (!newStartIso) throw new BadRequestException('newStartIso is required');

    // ============================
    // 0) READS + VALIDATIONS (FUERA DE TX)
    // ============================

    const booking = await this.db.query.publicBookings.findFirst({
      where: eq(publicBookings.id, bookingId),
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Cancelled booking cannot be rescheduled');
    }

    if (booking.status === 'COMPLETED') {
      throw new BadRequestException('Completed booking cannot be rescheduled');
    }

    // 🔐 Ownership check (solo PUBLIC)
    if (rescheduledBy === 'PUBLIC') {
      if (!publicUserId) throw new ForbiddenException('Not authenticated');
      if (booking.publicUserId !== publicUserId) {
        throw new ForbiddenException('Booking does not belong to this user');
      }
    }

    const currentAppointments = await this.db.query.appointments.findMany({
      where: eq(appointments.publicBookingId, bookingId),
    });

    if (!currentAppointments.length) {
      throw new BadRequestException('Booking has no appointments');
    }

    // Snapshot BEFORE
    const beforeSnapshot = {
      booking: {
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        totalCents: booking.totalCents,
      },
      appointments: currentAppointments.map((a) => ({
        id: a.id,
        serviceId: a.serviceId,
        staffId: a.staffId,
        start: a.start,
        end: a.end,
      })),
    };

    // Chain desde booking actual
    const chain = [...currentAppointments]
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .map((a) => ({
        serviceId: a.serviceId,
        staffId: a.staffId,
      }));

    const date = DateTime.fromISO(newStartIso).toISODate()!;

    // ============================
    // 1) BUILD PLAN (FUERA DE TX)
    // ============================

    const plan = await this.managerChainBuild({
      branchId: booking.branchId,
      date,
      pinnedStartIso: newStartIso,
      chain,
    });

    // ============================
    // 2) OVERLAP CHECK (FUERA DE TX)
    // ============================

    for (const a of plan.plan.assignments) {
      const overlap = await this.hasOverlap({
        branchId: booking.branchId,
        staffId: a.staffId,
        startUtc: DateTime.fromISO(a.startIso),
        endUtc: DateTime.fromISO(a.endIso),
      });

      if (overlap) {
        throw new BadRequestException('Timeslot already booked');
      }
    }

    // Compute new starts/ends (FUERA DE TX)
    const newStartsAt = DateTime.fromISO(plan.plan.assignments[0].startIso)
      .toUTC()
      .toJSDate();

    const newEndsAt = DateTime.fromISO(
      plan.plan.assignments[plan.plan.assignments.length - 1].endIso,
    )
      .toUTC()
      .toJSDate();

    // Snapshot AFTER
    const afterSnapshot = {
      booking: {
        startsAt: newStartsAt,
        endsAt: newEndsAt,
        totalCents: booking.totalCents,
      },
      appointments: plan.plan.assignments,
    };

    // ============================
    // 3) WRITES (DENTRO DE TX) — SOLO ESCRITURA
    // ============================

    const result = await this.db.transaction(async (tx) => {
      // Re-check rápido (evita reagendar algo que cambió en medio)
      const latest = await tx.query.publicBookings.findFirst({
        where: eq(publicBookings.id, bookingId),
      });

      if (!latest) throw new NotFoundException('Booking not found');

      if (latest.status === 'CANCELLED') {
        throw new BadRequestException(
          'Cancelled booking cannot be rescheduled',
        );
      }

      if (latest.status === 'COMPLETED') {
        throw new BadRequestException(
          'Completed booking cannot be rescheduled',
        );
      }

      // 7️⃣ Update booking
      await tx
        .update(publicBookings)
        .set({
          startsAt: newStartsAt,
          endsAt: newEndsAt,
          updatedAt: new Date(),
        })
        .where(eq(publicBookings.id, bookingId));

      // 8️⃣ Update appointments (shift total)
      // (assume mismo length y mismo orden)
      for (let i = 0; i < currentAppointments.length; i++) {
        const appt = currentAppointments[i];
        const next = plan.plan.assignments[i];

        if (!next) {
          throw new BadRequestException('Plan mismatch with appointments');
        }

        await tx
          .update(appointments)
          .set({
            start: DateTime.fromISO(next.startIso).toUTC().toJSDate(),
            end: DateTime.fromISO(next.endIso).toUTC().toJSDate(),
            updatedAt: new Date(),
          })
          .where(eq(appointments.id, appt.id));
      }

      // 🔟 Historial
      await tx.insert(bookingReschedules).values({
        bookingId,
        rescheduledByPublicUserId: publicUserId ?? null,
        reason: reason ?? 'SYSTEM',
        notes: notes ?? null,
        previousBookingSnapshot: beforeSnapshot,
        newBookingSnapshot: afterSnapshot,
      });

      return { bookingId };
    });

    // ============================
    // 4) SIDE EFFECTS (FUERA DE TX)
    // ============================

    await this.publicBookingJobsService.cancelScheduledJobs(bookingId);

    await this.publicBookingJobsService.scheduleBookingLifecycle({
      bookingId,
      startsAtUtc: newStartsAt,
      endsAtUtc: newEndsAt,
    });

    return {
      ok: true,
      bookingId: result.bookingId,
      startsAt: newStartsAt,
      endsAt: newEndsAt,
    };
  }
}
