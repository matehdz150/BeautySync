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

type BookingListRow = {
  bookingId: string;
  branchId: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  totalPriceCents: number | null;
  branchName: string;
  branchSlug: string | null;
  coverUrl: string | null;
  itemsCount: number;
  servicesPreview: PublicBookingListItem['servicesPreview'] | string | null;
  staffPreview: PublicBookingListItem['staffPreview'] | string | null;
};

type BookingDetailRow = {
  bookingId: string;
  bookingStatus: string;
  startsAt: Date;
  endsAt: Date;
  paymentMethod: string | null;
  notes: string | null;
  totalCents: number | null;
  branchId: string;
  branchName: string;
  branchSlug: string | null;
  branchAddress: string | null;
  coverUrl: string | null;
  timezone: string | null;
  appointments:
    | Array<{
        id: string;
        status: string;
        startUtc: string;
        endUtc: string;
        priceCents: number | null;
        serviceId: string;
        serviceName: string;
        staffId: string;
        staffName: string;
        staffAvatarUrl: string | null;
      }>
    | string
    | null;
};

type BookingDetailAppointment = {
  id: string;
  status: string;
  startUtc: string;
  endUtc: string;
  priceCents: number | null;
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  staffAvatarUrl: string | null;
};

function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T[];
    } catch {
      return [];
    }
  }

  return [];
}

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
    const nowIso = nowUtc.toISO();

    // cursor
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    let cursorUtc: DateTime | null = null;
    if (query.cursor) {
      const parsed = DateTime.fromISO(query.cursor, { zone: 'utc' });
      if (!parsed.isValid) throw new BadRequestException('Invalid cursor');
      cursorUtc = parsed;
    }
    const cursorIso = cursorUtc?.toISO() ?? null;

    const timeFilterSql =
      tab === 'UPCOMING'
        ? sql`pb.starts_at >= ${nowIso}`
        : sql`pb.starts_at < ${nowIso}`;

    const cursorFilterSql =
      cursorUtc && tab === 'UPCOMING'
        ? sql`AND pb.starts_at > ${cursorIso}`
        : cursorUtc && tab === 'PAST'
          ? sql`AND pb.starts_at < ${cursorIso}`
          : sql``;

    const orderDirectionSql = tab === 'PAST' ? sql`DESC` : sql`ASC`;

    const bookingRows = (await this.db.execute<BookingListRow>(sql`
      WITH selected_bookings AS (
        SELECT
          pb.id as "bookingId",
          pb.branch_id as "branchId",
          pb.starts_at as "startsAt",
          pb.ends_at as "endsAt",
          pb.status,
          pb.total_cents as "totalPriceCents"
        FROM public_bookings pb
        WHERE pb.public_user_id = ${publicUserId}
          AND ${timeFilterSql}
          ${cursorFilterSql}
        ORDER BY pb.starts_at ${orderDirectionSql}
        LIMIT ${limit + 1}
      )
      SELECT
        sb."bookingId",
        sb."branchId",
        sb."startsAt",
        sb."endsAt",
        sb.status,
        sb."totalPriceCents",
        b.name as "branchName",
        b.public_slug as "branchSlug",
        (
          SELECT bi.url
          FROM branch_images bi
          WHERE bi.branch_id = b.id
          ORDER BY bi.is_cover DESC, bi.position ASC NULLS LAST, bi.created_at ASC
          LIMIT 1
        ) as "coverUrl",
        COALESCE((
          SELECT COUNT(*)::int
          FROM appointments a
          WHERE a.public_booking_id = sb."bookingId"
        ), 0) as "itemsCount",
        COALESCE((
          SELECT json_agg(
            json_build_object('id', preview.id, 'name', preview.name)
            ORDER BY preview.start_at ASC
          )
          FROM (
            SELECT DISTINCT ON (s.id)
              s.id,
              s.name,
              a.start as start_at
            FROM appointments a
            INNER JOIN services s ON s.id = a.service_id
            WHERE a.public_booking_id = sb."bookingId"
            ORDER BY s.id, a.start ASC
            LIMIT 3
          ) preview
        ), '[]'::json) as "servicesPreview",
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'id', preview.id,
              'name', preview.name,
              'avatarUrl', preview.avatar_url
            )
            ORDER BY preview.start_at ASC
          )
          FROM (
            SELECT DISTINCT ON (st.id)
              st.id,
              st.name,
              st.avatar_url,
              a.start as start_at
            FROM appointments a
            INNER JOIN staff st ON st.id = a.staff_id
            WHERE a.public_booking_id = sb."bookingId"
            ORDER BY st.id, a.start ASC
            LIMIT 3
          ) preview
        ), '[]'::json) as "staffPreview"
      FROM selected_bookings sb
      INNER JOIN branches b ON b.id = sb."branchId"
      ORDER BY sb."startsAt" ${orderDirectionSql}
    `)) as unknown as BookingListRow[];

    const hasMore = bookingRows.length > limit;
    const slicedBookings = bookingRows.slice(0, limit);

    if (slicedBookings.length === 0) {
      return { items: [], nextCursor: null };
    }

    const items: PublicBookingListItem[] = slicedBookings.map((b) => {
      return {
        bookingId: b.bookingId,
        status: b.status ?? 'PENDING',
        startsAtISO: new Date(b.startsAt).toISOString(),
        endsAtISO: new Date(b.endsAt).toISOString(),
        branch: {
          id: b.branchId,
          name: b.branchName ?? 'Sucursal',
          slug: b.branchSlug ?? '',
          coverUrl: b.coverUrl ?? null,
        },
        totalPriceCents: b.totalPriceCents ?? 0,
        itemsCount: Number(b.itemsCount ?? 0),
        servicesPreview: parseJsonArray<PublicBookingListItem['servicesPreview'][number]>(
          b.servicesPreview,
        ),
        staffPreview: parseJsonArray<PublicBookingListItem['staffPreview'][number]>(
          b.staffPreview,
        ),
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

    const [booking] = (await this.db.execute<BookingDetailRow>(sql`
      SELECT
        pb.id as "bookingId",
        pb.status as "bookingStatus",
        pb.starts_at as "startsAt",
        pb.ends_at as "endsAt",
        pb.payment_method as "paymentMethod",
        pb.notes,
        pb.total_cents as "totalCents",
        b.id as "branchId",
        b.name as "branchName",
        b.public_slug as "branchSlug",
        b.address as "branchAddress",
        (
          SELECT bi.url
          FROM branch_images bi
          WHERE bi.branch_id = b.id
          ORDER BY bi.is_cover DESC, bi.position ASC NULLS LAST, bi.created_at ASC
          LIMIT 1
        ) as "coverUrl",
        bs.timezone,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'id', a.id,
              'status', a.status,
              'startUtc', a.start,
              'endUtc', a."end",
              'priceCents', a.price_cents,
              'serviceId', s.id,
              'serviceName', s.name,
              'staffId', st.id,
              'staffName', st.name,
              'staffAvatarUrl', st.avatar_url
            )
            ORDER BY a.start ASC
          )
          FROM appointments a
          INNER JOIN services s ON s.id = a.service_id
          INNER JOIN staff st ON st.id = a.staff_id
          WHERE a.public_booking_id = pb.id
        ), '[]'::json) as appointments
      FROM public_bookings pb
      INNER JOIN branches b ON b.id = pb.branch_id
      LEFT JOIN branch_settings bs ON bs.branch_id = b.id
      WHERE pb.id = ${bookingId}
        AND pb.public_user_id = ${publicUserId}
        AND b.public_presence_enabled = true
      LIMIT 1
    `)) as unknown as BookingDetailRow[];

    if (!booking) throw new NotFoundException('Booking not found');

    const tz = booking.timezone ?? 'America/Mexico_City';
    const appointmentRows = parseJsonArray<BookingDetailAppointment>(
      booking.appointments,
    );

    if (!appointmentRows.length) {
      throw new NotFoundException('Booking not found');
    }

    const appointmentPayload = appointmentRows.map((appointment) => {
      const startUtc = DateTime.fromISO(String(appointment.startUtc), {
        zone: 'utc',
      });
      const endUtc = DateTime.fromISO(String(appointment.endUtc), {
        zone: 'utc',
      });

      return {
        id: appointment.id,
        status: appointment.status,
        startIso: startUtc.setZone(tz).toISO()!,
        endIso: endUtc.setZone(tz).toISO()!,
        durationMin: Math.round(endUtc.diff(startUtc, 'minutes').minutes),
        priceCents: appointment.priceCents ?? 0,
        service: {
          id: appointment.serviceId,
          name: appointment.serviceName,
        },
        staff: {
          id: appointment.staffId,
          name: appointment.staffName,
          avatarUrl: appointment.staffAvatarUrl ?? null,
        },
      };
    });

    const firstStartDate = DateTime.fromJSDate(booking.startsAt, { zone: 'utc' })
      .setZone(tz)
      .toISODate();

    return {
      ok: true,
      booking: {
        id: bookingId,
        branch: {
          id: booking.branchId,
          name: booking.branchName,
          slug: booking.branchSlug ?? undefined,
          coverUrl: booking.coverUrl ?? null,
          address: booking.branchAddress ?? '',
        },
        date: firstStartDate,
        paymentMethod: booking.paymentMethod ?? 'ONSITE',
        notes: booking.notes ?? null,
        totalCents: booking.totalCents ?? 0,
        appointments: appointmentPayload,
      },
    };
  }
}
