/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as client from 'src/db/client';
import {
  appointments,
  AppointmentStatus,
  appointmentStatusHistory,
  branchSettings,
  clients,
  serviceCategories,
  services,
  staff,
} from '../db/schema';
import { AvailabilityService } from 'src/availability/availability.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { DateTime } from 'luxon';
import { and, eq, lt, gte, ne, sql, gt } from 'drizzle-orm';
import { GetAppointmentsDto } from './dto/get-appointments.dto';

const VALID_STATUSES: AppointmentStatus[] = [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'NO_SHOW',
  'COMPLETED',
];

@Injectable()
export class AppointmentsService {
  constructor(
    @Inject('DB') private db: client.DB,
    private readonly availability: AvailabilityService,
  ) {}

  async create(dto: CreateAppointmentDto) {
    const { branchId, serviceId, staffId, start } = dto;

    // 1️⃣ Servicio
    const service = await this.db.query.services.findFirst({
      where: eq(services.id, serviceId),
    });

    if (!service) throw new BadRequestException('Service not found');

    // 2️⃣ Settings
    const settings = await this.db.query.branchSettings.findFirst({
      where: eq(branchSettings.branchId, branchId),
    });

    const tz = settings?.timezone ?? 'America/Mexico_City';
    const bufferBefore = settings?.bufferBeforeMin ?? 0;
    const bufferAfter = settings?.bufferAfterMin ?? 0;

    // 3️⃣ Parse start (UTC)
    const startUtc = DateTime.fromISO(start, { zone: 'utc' }).set({
      millisecond: 0,
      second: 0,
    });
    if (!startUtc.isValid)
      throw new BadRequestException('Invalid start datetime');

    // 4️⃣ Calcular duración REAL
    const totalMinutes = service.durationMin + bufferBefore + bufferAfter;

    // 5️⃣ Redondear hacia ARRIBA a 30 mins
    const BLOCK_MINUTES = 15;

    const roundedMinutes =
      Math.ceil(totalMinutes / BLOCK_MINUTES) * BLOCK_MINUTES;

    // 6️⃣ Calcular END en UTC
    const endUtc = startUtc.plus({ minutes: roundedMinutes }).set({
      millisecond: 0,
      second: 0,
    });

    // 7️⃣ Obtener fecha local para availability
    const dateLocal = startUtc.setZone(tz).toISODate();

    // 8️⃣ Recalcular disponibilidad (UX — opcional pero útil)
    const availability = await this.availability.getAvailability({
      branchId,
      serviceId,
      date: dateLocal,
      staffId,
    });

    // (Solo lo usamos como validación previa amable)
    const slotIso = startUtc.toISO();
    const staffSlots = availability.staff.find((s) => s.staffId === staffId);

    console.log('startUtc', startUtc.toISO());
    console.log('availability slots', staffSlots?.slots);

    if (!staffSlots || !staffSlots.slots.includes(slotIso)) {
      throw new BadRequestException('Selected slot is not available');
    }

    // 9️⃣ Transacción — defensa REAL contra overlaps
    return this.db.transaction(async (tx) => {
      const overlapping = await tx
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.branchId, branchId),
            eq(appointments.staffId, staffId),

            // start < newEnd
            lt(appointments.start, endUtc.toJSDate()),

            // end > newStart
            gt(appointments.end, startUtc.toJSDate()),
          ),
        );

      if (overlapping.length > 0) {
        throw new BadRequestException('Timeslot already booked');
      }

      // 🔟 Insertar cita
      const [created] = await tx
        .insert(appointments)
        .values({
          branchId,
          clientId: dto.clientId ?? null,
          staffId,
          serviceId,
          start: startUtc.toJSDate(),
          end: endUtc.toJSDate(),
          status: 'CONFIRMED',
          notes: dto.notes,
          priceCents: service.priceCents,
        })
        .returning();

      // 1️⃣1️⃣ Log historial
      await tx.insert(appointmentStatusHistory).values({
        appointmentId: created.id,
        newStatus: 'CONFIRMED',
        reason: 'Initial booking',
      });

      return created;
    });
  }

  async findAll(query: GetAppointmentsDto) {
    const { branchId, staffId, date, status } = query;

    const take =
      query.limit && query.limit > 0 && query.limit <= 100 ? query.limit : 50;

    const skip = query.offset ?? 0;

    if (!branchId) throw new BadRequestException('branchId is required');

    const where = [eq(appointments.branchId, branchId)];

    if (staffId) where.push(eq(appointments.staffId, staffId));
    if (status)
      where.push(eq(appointments.status, status as AppointmentStatus));

    // timezone awareness
    const settings = await this.db.query.branchSettings.findFirst({
      where: eq(branchSettings.branchId, branchId),
    });

    const tz = settings?.timezone ?? 'America/Mexico_City';

    if (date) {
      const start = DateTime.fromISO(date, { zone: tz }).startOf('day').toUTC();

      const end = start.plus({ days: 1 });

      where.push(
        gte(appointments.start, start.toJSDate()),
        lt(appointments.start, end.toJSDate()),
      );
    }

    const [rows, [{ count }]] = await Promise.all([
      this.db
        .select({
          id: appointments.id,
          start: appointments.start,
          end: appointments.end,
          status: appointments.status,
          priceCents: appointments.priceCents,

          staff: {
            id: staff.id,
            name: staff.name,
          },
          service: {
            id: services.id,
            name: services.name,
            durationMin: services.durationMin,
            categoryColor: serviceCategories.colorHex,
            categoryIcon: serviceCategories.icon,
          },
          client: {
            id: clients.id,
            name: clients.name,
            email: clients.email,
          },
        })
        .from(appointments)
        .leftJoin(staff, eq(staff.id, appointments.staffId))
        .leftJoin(services, eq(services.id, appointments.serviceId))
        .leftJoin(clients, eq(clients.id, appointments.clientId))
        .leftJoin(
          serviceCategories,
          eq(serviceCategories.id, services.categoryId),
        )
        .where(and(...where))
        .orderBy(appointments.start)
        .limit(take)
        .offset(skip),

      this.db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(appointments)
        .where(and(...where)),
    ]);

    return { total: count, data: rows };
  }

  async updateStatus(
    id: string,
    dto: { status: string; reason?: string; changedByUserId?: string },
  ) {
    const { status, reason, changedByUserId } = dto;

    if (!VALID_STATUSES.includes(status as any)) {
      throw new BadRequestException('Invalid status');
    }

    return this.db.transaction(async (tx) => {
      // 🔍 trae la cita
      const existing = await tx.query.appointments.findFirst({
        where: eq(appointments.id, id),
      });

      if (!existing) throw new BadRequestException('Appointment not found');

      if (existing.status === 'CANCELLED') {
        throw new BadRequestException('Cancelled appointments cannot change');
      }

      if (existing.status === status) {
        return existing; // nada que hacer
      }

      // 📝 guarda historial
      await tx.insert(appointmentStatusHistory).values({
        appointmentId: id,
        oldStatus: existing.status,
        newStatus: status,
        reason,
        changedByUserId,
      });

      // 🔄 update real
      const [updated] = await tx
        .update(appointments)
        .set({ status: dto.status as AppointmentStatus })
        .where(eq(appointments.id, id))
        .returning();

      return updated;
    });
  }

  async reschedule(
    id: string,
    dto: {
      start: string;
      staffId?: string;
      reason?: string;
      changedByUserId?: string;
    },
  ) {
    return this.db.transaction(async (tx) => {
      const existing = await tx.query.appointments.findFirst({
        where: eq(appointments.id, id),
      });

      if (!existing) throw new BadRequestException('Appointment not found');
      if (existing.status === 'CANCELLED')
        throw new BadRequestException(
          'Cancelled appointments cannot be rescheduled',
        );

      const service = await tx.query.services.findFirst({
        where: eq(services.id, existing.serviceId),
      });

      if (!service) throw new BadRequestException('Service not found');

      const settings = await tx.query.branchSettings.findFirst({
        where: eq(branchSettings.branchId, existing.branchId),
      });

      const tz = settings?.timezone ?? 'America/Mexico_City';
      const bufferBefore = settings?.bufferBeforeMin ?? 0;
      const bufferAfter = settings?.bufferAfterMin ?? 0;

      const BLOCK_MINUTES = 15;

      const total = service.durationMin + bufferBefore + bufferAfter;

      const rounded = Math.ceil(total / BLOCK_MINUTES) * BLOCK_MINUTES;

      const startUtc = DateTime.fromISO(dto.start, { zone: 'utc' });
      if (!startUtc.isValid)
        throw new BadRequestException('Invalid start datetime');

      const endUtc = startUtc.plus({ minutes: rounded });

      const startLocal = startUtc.setZone(tz);
      const date = startLocal.toISODate();

      const targetStaff = dto.staffId ?? existing.staffId;

      // 1️⃣ verifica disponibilidad real
      const availability = await this.availability.getAvailability({
        branchId: existing.branchId,
        serviceId: existing.serviceId,
        date,
        staffId: targetStaff,
      });

      const staffSlots = availability.staff.find(
        (s) => s.staffId === targetStaff,
      );

      if (!staffSlots?.slots.includes(startUtc.toISO())) {
        throw new BadRequestException('Selected slot is not available');
      }

      // 2️⃣ asegura que no haya overlaps (última línea de defensa)
      const overlapping = await tx
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.branchId, existing.branchId),
            eq(appointments.staffId, targetStaff),
            lt(appointments.start, endUtc.toJSDate()),
            gte(appointments.end, startUtc.toJSDate()),
            // excluye la misma cita
            ne(appointments.id, existing.id),
          ),
        );

      if (overlapping.length > 0)
        throw new BadRequestException('Timeslot already booked');

      // 3️⃣ actualiza cita
      const [updated] = await tx
        .update(appointments)
        .set({
          start: startUtc.toJSDate(),
          end: endUtc.toJSDate(),
          staffId: targetStaff,
        })
        .where(eq(appointments.id, id))
        .returning();

      // 4️⃣ guarda historial
      await tx.insert(appointmentStatusHistory).values({
        appointmentId: id,
        oldStatus: existing.status,
        newStatus: existing.status, // sólo cambio de horario
        reason: dto.reason ?? 'Rescheduled',
        changedByUserId: dto.changedByUserId,
      });

      return updated;
    });
  }
}
