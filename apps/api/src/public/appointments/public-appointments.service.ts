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

import * as client from 'src/db/client';
import {
  appointments,
  branches,
  branchSettings,
  services,
  staff,
} from 'src/db/schema';

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

    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    let cursorUtc: DateTime | null = null;
    if (query.cursor) {
      const parsed = DateTime.fromISO(query.cursor, { zone: 'utc' });
      if (!parsed.isValid) throw new BadRequestException('Invalid cursor');
      cursorUtc = parsed;
    }

    const timeFilter =
      tab === 'UPCOMING'
        ? gte(appointments.start, nowUtc.toJSDate())
        : lt(appointments.start, nowUtc.toJSDate());

    const cursorFilter =
      cursorUtc && tab === 'UPCOMING'
        ? gt(appointments.start, cursorUtc.toJSDate())
        : cursorUtc && tab === 'PAST'
          ? lt(appointments.start, cursorUtc.toJSDate())
          : undefined;

    const where = and(
      eq(appointments.publicUserId, publicUserId),
      timeFilter,
      cursorFilter,
      sql`${appointments.publicBookingId} is not null`,
    );

    // ✅ FIX: ORDER BY debe usar un agregado (min(start))
    const orderBy =
      tab === 'PAST'
        ? desc(sql<Date>`min(${appointments.start})`)
        : asc(sql<Date>`min(${appointments.start})`);

    const bookingRows = await this.db
      .select({
        bookingId: appointments.publicBookingId,
        branchId: appointments.branchId,

        startsAt: sql<Date>`min(${appointments.start})`.as('startsAt'),
        endsAt: sql<Date>`max(${appointments.end})`.as('endsAt'),

        itemsCount: sql<number>`count(*)`.as('itemsCount'),
        totalPriceCents: sql<number | null>`
        coalesce(sum(${appointments.priceCents}), 0)
      `.as('totalPriceCents'),
      })
      .from(appointments)
      .where(where)
      .groupBy(appointments.publicBookingId, appointments.branchId)
      .orderBy(orderBy)
      .limit(limit + 1);

    const hasMore = bookingRows.length > limit;
    const slicedBookings = bookingRows.slice(0, limit);

    const bookingIds = slicedBookings
      .map((b) => b.bookingId)
      .filter(Boolean) as string[];

    if (bookingIds.length === 0) {
      return { items: [], nextCursor: null };
    }

    const appointmentRows = await this.db
      .select({
        bookingId: appointments.publicBookingId,
        status: appointments.status,

        branchId: appointments.branchId,
        branchName: branches.name,
        branchSlug: branches.publicSlug,

        staffId: staff.id,
        staffName: staff.name,
        staffAvatarUrl: staff.avatarUrl,

        serviceId: services.id,
        serviceName: services.name,

        start: appointments.start,
        end: appointments.end,
        priceCents: appointments.priceCents,
      })
      .from(appointments)
      .innerJoin(branches, eq(branches.id, appointments.branchId))
      .innerJoin(staff, eq(staff.id, appointments.staffId))
      .innerJoin(services, eq(services.id, appointments.serviceId))
      .where(inArray(appointments.publicBookingId, bookingIds))
      .orderBy(asc(appointments.start));

    const branchIds = Array.from(
      new Set(slicedBookings.map((b) => b.branchId)),
    );

    const branchesWithImages = await this.db.query.branches.findMany({
      where: inArray(branches.id, branchIds),
      with: { images: true },
    });

    const coverByBranchId = new Map<string, string | null>();

    for (const b of branchesWithImages) {
      const cover =
        b.images?.find((img) => img.isCover)?.url ?? b.images?.[0]?.url ?? null;

      coverByBranchId.set(b.id, cover);
    }

    const map = new Map<string, typeof appointmentRows>();

    for (const row of appointmentRows) {
      const id = row.bookingId;
      if (!id) continue;
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(row);
    }

    const items: PublicBookingListItem[] = slicedBookings.map((b) => {
      const bookingId = b.bookingId as string;
      const rows = map.get(bookingId) ?? [];

      const first = rows[0];

      const branchSlug = first?.branchSlug ?? '';
      const branchName = first?.branchName ?? 'Sucursal';

      const statusPriority = (s: string) => {
        if (s === 'CONFIRMED') return 4;
        if (s === 'PENDING') return 3;
        if (s === 'COMPLETED') return 2;
        if (s === 'CANCELLED') return 1;
        return 0;
      };

      const status =
        rows
          .map((r) => r.status)
          .sort((a, z) => statusPriority(z) - statusPriority(a))[0] ??
        'PENDING';

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

        status,
        startsAtISO: new Date(b.startsAt).toISOString(),
        endsAtISO: new Date(b.endsAt).toISOString(),

        branch: {
          id: b.branchId,
          name: branchName,
          slug: branchSlug,
          coverUrl: coverByBranchId.get(b.branchId) ?? null,
        },

        totalPriceCents: b.totalPriceCents ?? null,
        itemsCount: Number(b.itemsCount ?? 1),

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

    // 1) traer appointments del booking
    const rows = await this.db.query.appointments.findMany({
      where: eq(appointments.publicBookingId, bookingId),
    });

    if (!rows.length) throw new NotFoundException('Booking not found');

    // 2) ownership check
    if (rows.some((r) => r.publicUserId !== publicUserId)) {
      throw new NotFoundException('Booking not found');
    }

    // 3) branch
    const branchId = rows[0].branchId;

    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
      with: { images: true },
    });

    if (!branch) throw new NotFoundException('Branch not found');
    if (!branch.publicPresenceEnabled) {
      throw new ForbiddenException('Branch is not public');
    }

    // 4) timezone
    const settings = await this.db.query.branchSettings.findFirst({
      where: eq(branchSettings.branchId, branch.id),
    });

    const tz = settings?.timezone ?? 'America/Mexico_City';

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
    const totalCents = appointmentPayload.reduce(
      (acc, x) => acc + (x.priceCents ?? 0),
      0,
    );

    const firstStartDate = DateTime.fromJSDate(ordered[0].start, {
      zone: 'utc',
    })
      .setZone(tz)
      .toISODate();

    const paymentMethod = ordered.some((a) => a.paymentStatus === 'PAID')
      ? 'ONLINE'
      : 'ONSITE';

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
        notes: ordered[0].notes ?? null,

        totalCents,
        appointments: appointmentPayload,
      },
    };
  }
}
