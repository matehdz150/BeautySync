import { sql, SQL } from 'drizzle-orm';

import { db } from 'src/modules/db/client';

import { CalendarEvent, TimeOffEvent } from '../core/entities/calendar-event.entity';
import { CalendarEventsPort } from '../core/ports/calendar-events.port';

type CalendarEventRow = {
  eventId: string;
  staffId: string;
  start: Date | string;
  end: Date | string;
  type: CalendarEvent['type'];
  bookingId: string | null;
  clientName: string | null;
  serviceName: string | null;
  color: string | null;
  reason: string | null;
};

export class CalendarEventsDrizzleAdapter implements CalendarEventsPort {
  async findByBranchAndRange(params: {
    branchId: string;
    start: Date;
    end: Date;
    staffId?: string;
  }): Promise<CalendarEvent[]> {
    const startIso = params.start.toISOString();
    const endIso = params.end.toISOString();
    const conditions = [
      sql`a.branch_id = ${params.branchId}`,
      sql`a.start >= ${startIso}::timestamptz`,
      sql`a.start < ${endIso}::timestamptz`,
      sql`a.status <> 'CANCELLED'`,
    ] as SQL[];

    const timeOffConditions = [
      sql`t.branch_id = ${params.branchId}`,
      sql`t.start < ${endIso}::timestamptz`,
      sql`t."end" > ${startIso}::timestamptz`,
    ] as SQL[];

    if (params.staffId) {
      conditions.push(sql`a.staff_id = ${params.staffId}`);
      timeOffConditions.push(sql`t.staff_id = ${params.staffId}`);
    }

    const rows = await db.execute<CalendarEventRow>(sql`
      (
        SELECT
          a.id::text AS "eventId",
          a.staff_id AS "staffId",
          a.start AS "start",
          a."end" AS "end",
          'APPOINTMENT'::text AS "type",
          a.public_booking_id AS "bookingId",
          c.name AS "clientName",
          s.name AS "serviceName",
          sc.color_hex AS "color",
          NULL::text AS "reason"
        FROM appointments a
        LEFT JOIN clients c
          ON c.id = a.client_id
        LEFT JOIN services s
          ON s.id = a.service_id
        LEFT JOIN service_categories sc
          ON sc.id = s.category_id
        WHERE ${sql.join(conditions, sql` AND `)}
      )
      UNION ALL
      (
        SELECT
          t.id::text AS "eventId",
          t.staff_id AS "staffId",
          t.start AS "start",
          t."end" AS "end",
          'TIME_OFF'::text AS "type",
          NULL::uuid AS "bookingId",
          NULL::text AS "clientName",
          NULL::text AS "serviceName",
          NULL::text AS "color",
          t.reason AS "reason"
        FROM staff_time_off t
        WHERE ${sql.join(timeOffConditions, sql` AND `)}
      )
      ORDER BY "start" ASC
    `);

    return rows.map((row) => {
      const start = row.start instanceof Date ? row.start : new Date(row.start);
      const end = row.end instanceof Date ? row.end : new Date(row.end);

      if (row.type === 'TIME_OFF') {
        return {
          type: 'TIME_OFF',
          id: Number(row.eventId),
          staffId: row.staffId,
          start,
          end,
          reason: row.reason ?? undefined,
        } satisfies TimeOffEvent;
      }

      return {
        type: 'APPOINTMENT',
        id: row.eventId,
        staffId: row.staffId,
        bookingId: row.bookingId,
        start,
        end,
        clientName: row.clientName ?? 'Cliente',
        serviceName: row.serviceName ?? 'Servicio',
        color: row.color ?? undefined,
      };
    });
  }
}
