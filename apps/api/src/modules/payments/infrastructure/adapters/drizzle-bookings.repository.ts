import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { appointments } from 'src/modules/db/schema/appointments';
import { services } from 'src/modules/db/schema/services';
import type { DB } from 'src/modules/db/client';
import { BookingsRepositoryPort } from '../../core/ports/bookings.repository';
import { publicUserClients } from 'src/modules/db/schema/public/public-user-clients';
import { publicBookings } from 'src/modules/db/schema/public/public-bookings';
import { clients } from 'src/modules/db/schema/clients/clients';

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
}
