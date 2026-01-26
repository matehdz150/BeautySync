/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, gt, gte, inArray, lt, sql } from 'drizzle-orm';
import { DateTime } from 'luxon';

import * as client from 'src/modules/db/client';
import {
  appointments,
  branches,
  branchSettings,
  publicBookings,
  services,
  staff,
} from 'src/modules/db/schema';

import { GetMyPublicAppointmentsQueryDto } from '../dto/get-my-appointments.dto';

export type PublicBookingListItem = {
  bookingId: string;

  status: string; // AppointmentStatus
  startsAtISO: string;
  endsAtISO: string;

  branch: {
    id: string;
    name: string;
    slug: string;
    coverUrl: string | null;
  };

  totalPriceCents: number | null;
  itemsCount: number;

  servicesPreview: { id: string; name: string }[];
  staffPreview: { id: string; name: string; avatarUrl: string | null }[];
};

export type PublicBookingsListResponse = {
  items: PublicBookingListItem[];
  nextCursor: string | null;
};

@Injectable()
export class PublicAppointmentsService {
  constructor(@Inject('DB') private db: client.DB) {}

  /**
   * Lista de bookings del usuario público (UPCOMING / PAST)
   * Agrupa por publicBookingId (1 booking puede tener N appointments)
   */
  async getMyBookings(params: {
    publicUserId: string;
    query: GetMyPublicAppointmentsQueryDto;
  }): Promise<PublicBookingsListResponse> {
    const { publicUserId, query } = params;

    if (!publicUserId) throw new ForbiddenException('Not authenticated');

    const tab = query.tab ?? 'UPCOMING';
    const limit = Math.min(query.limit ?? 20, 50);

    const nowUtc = DateTime.now().toUTC();

    // cursor
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    let cursorUtc: DateTime | null = null;
    if (query.cursor) {
      const parsed = DateTime.fromISO(query.cursor, { zone: 'utc' });
      if (!parsed.isValid) throw new BadRequestException('Invalid cursor');
      cursorUtc = parsed;
    }

    // UPCOMING/PAST ahora se basa en publicBookings.startsAt
    const timeFilter =
      tab === 'UPCOMING'
        ? gte(publicBookings.startsAt, nowUtc.toJSDate())
        : lt(publicBookings.startsAt, nowUtc.toJSDate());

    const cursorFilter =
      cursorUtc && tab === 'UPCOMING'
        ? gt(publicBookings.startsAt, cursorUtc.toJSDate())
        : cursorUtc && tab === 'PAST'
          ? lt(publicBookings.startsAt, cursorUtc.toJSDate())
          : undefined;

    const where = and(
      eq(publicBookings.publicUserId, publicUserId),
      timeFilter,
      cursorFilter,
    );

    const orderBy =
      tab === 'PAST'
        ? desc(publicBookings.startsAt)
        : asc(publicBookings.startsAt);

    // 1) bookings base
    const bookingRows = await this.db
      .select({
        bookingId: publicBookings.id,
        branchId: publicBookings.branchId,

        startsAt: publicBookings.startsAt,
        endsAt: publicBookings.endsAt,

        status: publicBookings.status,
        totalCents: publicBookings.totalCents,
      })
      .from(publicBookings)
      .where(where)
      .orderBy(orderBy)
      .limit(limit + 1);

    const hasMore = bookingRows.length > limit;
    const slicedBookings = bookingRows.slice(0, limit);

    if (slicedBookings.length === 0) {
      return { items: [], nextCursor: null };
    }

    const bookingIds = slicedBookings.map((b) => b.bookingId);
    const branchIds = Array.from(
      new Set(slicedBookings.map((b) => b.branchId)),
    );

    // 2) appointments de esos bookings para preview (servicios + staff)
    const appointmentRows = await this.db
      .select({
        bookingId: appointments.publicBookingId,

        serviceId: services.id,
        serviceName: services.name,

        staffId: staff.id,
        staffName: staff.name,
        staffAvatarUrl: staff.avatarUrl,

        start: appointments.start,
      })
      .from(appointments)
      .innerJoin(services, eq(services.id, appointments.serviceId))
      .innerJoin(staff, eq(staff.id, appointments.staffId))
      .where(inArray(appointments.publicBookingId, bookingIds))
      .orderBy(asc(appointments.start));

    // 3) branches + cover
    const branchesWithImages = await this.db.query.branches.findMany({
      where: inArray(branches.id, branchIds),
      with: { images: true },
    });

    const branchMap = new Map(branchesWithImages.map((b) => [b.id, b]));

    const coverByBranchId = new Map<string, string | null>();
    for (const b of branchesWithImages) {
      const cover =
        b.images?.find((img) => img.isCover)?.url ?? b.images?.[0]?.url ?? null;

      coverByBranchId.set(b.id, cover);
    }

    // 4) agrupar appointments por bookingId
    const rowsByBookingId = new Map<string, typeof appointmentRows>();
    for (const row of appointmentRows) {
      const id = row.bookingId;
      if (!id) continue;
      if (!rowsByBookingId.has(id)) rowsByBookingId.set(id, []);
      rowsByBookingId.get(id)!.push(row);
    }

    // 5) armar respuesta final
    const items: PublicBookingListItem[] = slicedBookings.map((b) => {
      const bookingId = b.bookingId;
      const rows = rowsByBookingId.get(bookingId) ?? [];

      const branch = branchMap.get(b.branchId);

      const uniqueServices = new Map<string, { id: string; name: string }>();
      const uniqueStaff = new Map<
        string,
        { id: string; name: string; avatarUrl: string | null }
      >();

      for (const r of rows) {
        uniqueServices.set(r.serviceId, {
          id: r.serviceId,
          name: r.serviceName,
        });
        uniqueStaff.set(r.staffId, {
          id: r.staffId,
          name: r.staffName,
          avatarUrl: r.staffAvatarUrl ?? null,
        });
      }

      return {
        bookingId,

        // 👇 status ahora viene directo del booking (mejor)
        status: b.status ?? 'PENDING',

        startsAtISO: new Date(b.startsAt).toISOString(),
        endsAtISO: new Date(b.endsAt).toISOString(),

        branch: {
          id: b.branchId,
          name: branch?.name ?? 'Sucursal',
          slug: branch?.publicSlug ?? '',
          coverUrl: coverByBranchId.get(b.branchId) ?? null,
        },

        // 👇 total ya viene del booking
        totalPriceCents: b.totalCents ?? 0,

        // 👇 itemsCount ya no lo trae booking (pero lo podemos calcular)
        itemsCount: rows.length || 1,

        servicesPreview: Array.from(uniqueServices.values()).slice(0, 3),
        staffPreview: Array.from(uniqueStaff.values()).slice(0, 3),
      };
    });

    const nextCursor =
      hasMore && slicedBookings.length > 0
        ? new Date(
            slicedBookings[slicedBookings.length - 1].startsAt,
          ).toISOString()
        : null;

    return { items, nextCursor };
  }

  async getMyBookingById(params: { bookingId: string; publicUserId: string }) {
    const { bookingId, publicUserId } = params;

    if (!publicUserId) throw new ForbiddenException('Not authenticated');
    if (!bookingId) throw new BadRequestException('bookingId is required');

    // 1) booking (source of truth)
    const booking = await this.db.query.publicBookings.findFirst({
      where: and(
        eq(publicBookings.id, bookingId),
        eq(publicBookings.publicUserId, publicUserId),
      ),
    });

    if (!booking) throw new NotFoundException('Booking not found');

    // 2) branch
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.id, booking.branchId),
      with: { images: true },
    });

    if (!branch) throw new NotFoundException('Branch not found');
    if (!branch.publicPresenceEnabled) {
      throw new ForbiddenException('Branch is not public');
    }

    // 3) timezone
    const settings = await this.db.query.branchSettings.findFirst({
      where: eq(branchSettings.branchId, branch.id),
    });

    const tz = settings?.timezone ?? 'America/Mexico_City';

    // 4) appointments del booking
    const rows = await this.db.query.appointments.findMany({
      where: eq(appointments.publicBookingId, bookingId),
    });

    if (!rows.length) throw new NotFoundException('Booking not found');

    // 5) load service + staff maps
    const serviceIds = Array.from(new Set(rows.map((r) => r.serviceId)));
    const staffIds = Array.from(new Set(rows.map((r) => r.staffId)));

    const serviceRows = await this.db.query.services.findMany({
      where: inArray(services.id, serviceIds),
    });

    const staffRows = await this.db.query.staff.findMany({
      where: inArray(staff.id, staffIds),
    });

    const serviceMap = new Map(serviceRows.map((s) => [s.id, s]));
    const staffMap = new Map(staffRows.map((s) => [s.id, s]));

    // 6) order by start
    const ordered = [...rows].sort((a, b) => {
      const aIso = new Date(a.start).toISOString();
      const bIso = new Date(b.start).toISOString();
      return aIso.localeCompare(bIso);
    });

    // 7) cover
    const coverUrl =
      branch.images?.find((img) => img.isCover)?.url ??
      branch.images?.[0]?.url ??
      null;

    // 8) build appointments payload (local ISO)
    const appointmentPayload = ordered.map((a) => {
      const srv = serviceMap.get(a.serviceId);
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

    // 9) totals + date
    // 🔥 ya no dependemos de appointments para total/date, usamos booking
    const totalCents = booking.totalCents ?? 0;

    const firstStartDate = DateTime.fromJSDate(booking.startsAt, {
      zone: 'utc',
    })
      .setZone(tz)
      .toISODate();

    const paymentMethod = booking.paymentMethod ?? 'ONSITE';

    return {
      ok: true,
      booking: {
        id: bookingId,

        branch: {
          id: branch.id,
          name: branch.name,
          slug: branch.publicSlug ?? undefined,
          coverUrl,
          address: branch.address ?? '',
        },

        date: firstStartDate,
        paymentMethod,
        notes: booking.notes ?? null,

        totalCents,
        appointments: appointmentPayload,
      },
    };
  }
}
