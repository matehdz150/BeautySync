import { appointments } from 'src/modules/db/schema/appointments/appointments';
import { AppointmentsPort } from '../core/ports/appointments.port';
import { db } from 'src/modules/db/client';
import { clients } from 'src/modules/db/schema/clients/clients';
import { serviceCategories } from 'src/modules/db/schema/services/serviceCategories';
import { services } from 'src/modules/db/schema/services/service';
import { SQL, and, count, eq, gte, lt, ne, sql } from 'drizzle-orm';

export class AppointmentsDrizzleAdapter implements AppointmentsPort {
  private buildConditions(params: {
    branchId: string;
    start: Date;
    end: Date;
    staffId?: string;
  }) {
    const { branchId, start, end, staffId } = params;

    const conditions: SQL[] = [
      eq(appointments.branchId, branchId),
      gte(appointments.start, start),
      lt(appointments.start, end),
      ne(appointments.status, 'CANCELLED'),
    ];

    if (staffId) {
      conditions.push(eq(appointments.staffId, staffId));
    }

    return conditions;
  }

  async findByBranchAndRange(params: {
    branchId: string;
    start: Date;
    end: Date;
    staffId?: string;
  }) {
    const conditions = this.buildConditions(params);

    const rows = await db
      .select({
        id: appointments.id,
        bookingId: appointments.publicBookingId,
        staffId: appointments.staffId,
        start: appointments.start,
        end: appointments.end,

        clientName: clients.name,
        serviceName: services.name,
        color: serviceCategories.colorHex,
      })
      .from(appointments)
      .leftJoin(clients, eq(clients.id, appointments.clientId))
      .leftJoin(services, eq(services.id, appointments.serviceId))
      .leftJoin(
        serviceCategories,
        eq(serviceCategories.id, services.categoryId),
      )
      .where(and(...conditions));

    return rows.map((r) => ({
      id: r.id,
      staffId: r.staffId,
      start: r.start,
      end: r.end,
      bookingId: r.bookingId ?? null,

      clientName: r.clientName ?? 'Cliente',
      serviceName: r.serviceName ?? 'Servicio',
      color: r.color ?? undefined,
    }));
  }

  async countDailyByBranchAndRange(params: {
    branchId: string;
    start: Date;
    end: Date;
    timezone: string;
    staffId?: string;
  }) {
    const conditions = this.buildConditions(params);
    const localDay = sql<Date>`date_trunc('day', ${appointments.start} AT TIME ZONE ${params.timezone})`;
    const rows = await db
      .select({ day: localDay, totalAppointments: count() })
      .from(appointments)
      .where(and(...conditions))
      .groupBy(sql`1`)
      .orderBy(sql`1 asc`);

    return rows.map((row) => ({
      date:
        row.day instanceof Date
          ? row.day.toISOString().slice(0, 10)
          : new Date(row.day).toISOString().slice(0, 10),
      totalAppointments: Number(row.totalAppointments ?? 0),
    }));
  }
}
