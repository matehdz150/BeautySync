import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { appointments } from 'src/modules/db/schema/appointments';
import { services } from 'src/modules/db/schema/services';
import type { DB } from 'src/modules/db/client';
import { BookingsRepositoryPort } from '../../core/ports/bookings.repository';
import { publicUserClients } from 'src/modules/db/schema/public/public-user-clients';
import { publicBookings } from 'src/modules/db/schema/public/public-bookings';
import { clients } from 'src/modules/db/schema/clients/clients';
import { staff } from 'src/modules/db/schema/staff/staff';
import { FullBooking } from '../../core/entities/booking.entity';

@Injectable()
export class DrizzleBookingsRepository implements BookingsRepositoryPort {
  constructor(@Inject('DB') private readonly db: DB) {}

  async findBookingServices(bookingId: string) {
    const rows = await this.db
      .select({
        id: services.id,
        name: services.name,
        priceCents: appointments.priceCents,
        staffId: appointments.staffId,
      })
      .from(appointments)
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.publicBookingId, bookingId));

    return rows.map((r) => ({
      ...r,
      priceCents: r.priceCents ?? 0,
    }));
  }

  async findBookingClient(bookingId: string): Promise<{
    id: string;
    name: string | null;
    email?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
  } | null> {
    const [row] = await this.db
      .select({
        id: clients.id,
        name: clients.name,
        email: clients.email,
        phone: clients.phone,
        avatarUrl: clients.avatarUrl,
      })
      .from(publicBookings)
      .leftJoin(
        appointments,
        eq(appointments.publicBookingId, publicBookings.id),
      )
      .leftJoin(
        publicUserClients,
        eq(publicUserClients.publicUserId, publicBookings.publicUserId),
      )
      .leftJoin(
        clients,
        eq(clients.id, appointments.clientId ?? publicUserClients.clientId),
      )
      .where(eq(publicBookings.id, bookingId))
      .limit(1);

    if (!row || !row.id) return null;

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      avatarUrl: row.avatarUrl ?? null,
    };
  }

  async findById(bookingId: string): Promise<{ id: string } | null> {
    const [row] = await this.db
      .select({
        id: publicBookings.id,
      })
      .from(publicBookings)
      .where(eq(publicBookings.id, bookingId))
      .limit(1);

    if (!row) return null;

    return {
      id: row.id,
    };
  }

  async findFullBookingById(bookingId: string) {
    const rows = await this.db
      .select({
        bookingId: publicBookings.id,
        branchId: publicBookings.branchId,
        startsAt: publicBookings.startsAt,
        endsAt: publicBookings.endsAt,
        status: publicBookings.status,
        paymentMethod: publicBookings.paymentMethod,
        totalCents: publicBookings.totalCents,
        notes: publicBookings.notes,

        appointmentId: appointments.id,
        appointmentStart: appointments.start,
        appointmentEnd: appointments.end,
        priceCents: appointments.priceCents,

        serviceId: services.id,
        serviceName: services.name,
        serviceDuration: services.durationMin,

        staffId: staff.id,
        staffName: staff.name,
        staffAvatar: staff.avatarUrl,
      })
      .from(publicBookings)
      .leftJoin(
        appointments,
        eq(appointments.publicBookingId, publicBookings.id),
      )
      .leftJoin(services, eq(services.id, appointments.serviceId))
      .leftJoin(staff, eq(staff.id, appointments.staffId))
      .where(eq(publicBookings.id, bookingId));

    if (!rows.length) return null;

    const booking: FullBooking = {
      id: rows[0].bookingId,
      branchId: rows[0].branchId,
      startsAt: rows[0].startsAt,
      endsAt: rows[0].endsAt,
      status: rows[0].status,
      paymentMethod: rows[0].paymentMethod,
      totalCents: rows[0].totalCents,
      notes: rows[0].notes ?? null,
      appointments: [],
    };

    for (const row of rows) {
      if (!row.appointmentId) continue;

      booking.appointments.push({
        id: row.appointmentId,
        start: row.appointmentStart!,
        end: row.appointmentEnd!,
        priceCents: row.priceCents ?? 0,

        service: {
          id: row.serviceId!,
          name: row.serviceName ?? '',
          durationMin: row.serviceDuration ?? 0,
        },

        staff: {
          id: row.staffId!,
          name: row.staffName ?? '',
          avatarUrl: row.staffAvatar ?? null,
        },
      });
    }

    return booking;
  }
}
