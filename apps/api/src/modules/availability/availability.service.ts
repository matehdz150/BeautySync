/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import * as client from 'src/modules/db/client';
import {
  appointments,
  branchSettings,
  services,
  staff,
  staffSchedules,
  staffTimeOff,
  staffServices,
  serviceCategories,
} from 'src/modules/db/schema';
import { and, eq, inArray, lt, gte } from 'drizzle-orm';
import { GetAvailabilityDto } from './dto/create-availability.dto';
import {
  dtToMinutesSinceDayStart,
  parseTimeToMinutes,
  subtractBusy,
} from './time-helpers';
import { DateTime } from 'luxon';
import { BLOCKING_APPOINTMENT_STATUSES } from '../lib/booking/booking.constants';

type StaffAvailability = {
  staffId: string;
  slots: string[];
};

@Injectable()
export class AvailabilityService {
  constructor(@Inject('DB') private db: client.DB) {}

  async getAvailability(query: GetAvailabilityDto) {
    const { branchId, serviceId, date, staffId, requiredDurationMin } = query;
    const isByService = typeof serviceId === 'string';
    const SLOT_MIN = 15;

    let durationMin: number;

    if (typeof requiredDurationMin === 'number') {
      durationMin = requiredDurationMin;
    } else if (serviceId) {
      const service = await this.db.query.services.findFirst({
        where: and(eq(services.id, serviceId), eq(services.branchId, branchId)),
      });

      if (!service)
        throw new BadRequestException('Service not found for this branch');

      if (!service.durationMin)
        throw new BadRequestException('Service duration not configured');

      durationMin = service.durationMin;
    } else {
      throw new BadRequestException(
        'serviceId or requiredDurationMin is required',
      );
    }

    // 2️⃣ Settings
    const settings = await this.db.query.branchSettings.findFirst({
      where: eq(branchSettings.branchId, branchId),
    });

    const tz = settings?.timezone ?? 'America/Mexico_City';
    const minBookingNoticeMin = settings?.minBookingNoticeMin ?? 0;
    const maxBookingAheadDays = settings?.maxBookingAheadDays ?? 60;
    const bufferBefore = settings?.bufferBeforeMin ?? 0;
    const bufferAfter = settings?.bufferAfterMin ?? 0;

    // 👉 número de slots necesarios
    const slotsNeeded = Math.ceil(
      (durationMin + bufferBefore + bufferAfter) / SLOT_MIN,
    );

    const nowLocal = DateTime.now().setZone(tz);
    const dayStartLocal = DateTime.fromISO(date, { zone: tz }).startOf('day');
    const dayEndLocal = dayStartLocal.endOf('day');

    const diffDays = dayStartLocal
      .startOf('day')
      .diff(nowLocal.startOf('day'), 'days').days;

    if (diffDays > maxBookingAheadDays)
      throw new BadRequestException('Date is beyond max booking ahead window');

    // 3️⃣ Staff elegible…
    let staffIds: string[] = [];

    if (staffId) {
      if (isByService) {
        const canDo = await this.db.query.staffServices.findFirst({
          where: and(
            eq(staffServices.staffId, staffId),
            eq(staffServices.serviceId, serviceId),
          ),
        });

        if (!canDo)
          throw new BadRequestException('Staff cannot perform this service');
      }

      const staffRow = await this.db.query.staff.findFirst({
        where: and(
          eq(staff.id, staffId),
          eq(staff.branchId, branchId),
          eq(staff.isActive, true),
        ),
      });

      if (!staffRow) {
        throw new BadRequestException('Staff is not active in this branch');
      }

      staffIds = [staffId];
    } else {
      if (isByService) {
        const staffWithService = await this.db
          .select({ staffId: staffServices.staffId })
          .from(staffServices)
          .innerJoin(
            staff,
            and(
              eq(staff.id, staffServices.staffId),
              eq(staff.branchId, branchId),
              eq(staff.isActive, true),
            ),
          )
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          .where(eq(staffServices.serviceId, serviceId!));

        staffIds = [...new Set(staffWithService.map((s) => s.staffId))];
      } else {
        // 🔥 modo por duración: cualquier staff activo
        const activeStaff = await this.db
          .select({ staffId: staff.id })
          .from(staff)
          .where(and(eq(staff.branchId, branchId), eq(staff.isActive, true)));

        staffIds = activeStaff.map((s) => s.staffId);
      }
    }

    if (staffIds.length === 0) return { date, branchId, serviceId, staff: [] };

    // 4️⃣ horarios del día
    const luxonWeekday = dayStartLocal.weekday; // 1=Mon … 7=Sun
    const dayOfWeek = luxonWeekday % 7;

    const schedules = await this.db
      .select()
      .from(staffSchedules)
      .where(
        and(
          inArray(staffSchedules.staffId, staffIds),
          eq(staffSchedules.dayOfWeek, dayOfWeek),
        ),
      );

    // 5️⃣ time off
    const dayStartUtc = dayStartLocal.toUTC().toJSDate();
    const dayEndUtc = dayEndLocal.toUTC().toJSDate();

    const timeOff = await this.db
      .select()
      .from(staffTimeOff)
      .where(
        and(
          inArray(staffTimeOff.staffId, staffIds),
          lt(staffTimeOff.start, dayEndUtc),
          gte(staffTimeOff.end, dayStartUtc),
        ),
      );

    // 6️⃣ citas existentes
    const existingAppointments = await this.db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.branchId, branchId),
          inArray(appointments.staffId, staffIds),
          lt(appointments.start, dayEndUtc),
          gte(appointments.end, dayStartUtc),
          inArray(appointments.status, BLOCKING_APPOINTMENT_STATUSES as any),
        ),
      );

    // 7️⃣ DISPONIBILIDAD FINAL
    const staffAvailability: StaffAvailability[] = [];

    for (const sId of staffIds) {
      const staffSched = schedules.filter((s) => s.staffId === sId);

      if (staffSched.length === 0) {
        staffAvailability.push({ staffId: sId, slots: [] });
        continue;
      }

      // libre base
      let freeBlocks = staffSched.map((s) => ({
        startMin: parseTimeToMinutes(s.startTime as any),
        endMin: parseTimeToMinutes(s.endTime as any),
      }));

      // restar ausencias
      const busyFromTimeOff = timeOff
        .filter((t) => t.staffId === sId)
        .map((t) => {
          const start = DateTime.fromJSDate(t.start).setZone(tz);
          const end = DateTime.fromJSDate(t.end).setZone(tz);

          return {
            startMin: dtToMinutesSinceDayStart(
              start < dayStartLocal ? dayStartLocal : start,
              dayStartLocal,
            ),
            endMin: dtToMinutesSinceDayStart(
              end > dayEndLocal ? dayEndLocal : end,
              dayStartLocal,
            ),
          };
        });

      freeBlocks = subtractBusy(freeBlocks, busyFromTimeOff);

      // restar citas
      const busyFromAppointments = existingAppointments
        .filter((a) => a.staffId === sId)
        .map((a) => {
          const start = DateTime.fromJSDate(a.start).setZone(tz);
          const end = DateTime.fromJSDate(a.end).setZone(tz);

          return {
            startMin: dtToMinutesSinceDayStart(start, dayStartLocal),
            endMin: dtToMinutesSinceDayStart(end, dayStartLocal),
          };
        });

      freeBlocks = subtractBusy(freeBlocks, busyFromAppointments);

      // 🎯 generar grid cada 30m
      let slotStarts: number[] = [];

      for (const block of freeBlocks) {
        let t = block.startMin;

        while (t + SLOT_MIN <= block.endMin) {
          slotStarts.push(t);
          t += SLOT_MIN;
        }
      }

      // 🎯 filtrar solo los que CABEN COMPLETOS
      slotStarts = slotStarts.filter((startMin) =>
        freeBlocks.some(
          (b) =>
            startMin >= b.startMin &&
            startMin + slotsNeeded * SLOT_MIN <= b.endMin,
        ),
      );

      // ⏰ min booking notice hoy
      if (dayStartLocal.hasSame(nowLocal, 'day') && minBookingNoticeMin > 0) {
        const nowMin = dtToMinutesSinceDayStart(nowLocal, dayStartLocal);
        slotStarts = slotStarts.filter(
          (m) => m >= nowMin + minBookingNoticeMin,
        );
      }

      // 🌎 pasar a ISO UTC
      const slotsIso = slotStarts.map((m) =>
        dayStartLocal.plus({ minutes: m }).toUTC().toISO(),
      );

      staffAvailability.push({ staffId: sId, slots: slotsIso });
    }

    return { date, branchId, serviceId, staff: staffAvailability };
  }

  async getAvailableServicesForSlot({
    branchId,
    staffId,
    datetime,
  }: {
    branchId: string;
    staffId: string;
    datetime: string;
  }) {
    // 1️⃣ Settings
    const settings = await this.db.query.branchSettings.findFirst({
      where: eq(branchSettings.branchId, branchId),
    });

    const tz = settings?.timezone ?? 'America/Mexico_City';
    const bufferBefore = settings?.bufferBeforeMin ?? 0;
    const bufferAfter = settings?.bufferAfterMin ?? 0;

    const start = DateTime.fromISO(datetime, { zone: tz });
    const dayStart = start.startOf('day');
    const dayEnd = start.endOf('day');

    // 2️⃣ Staff must belong to branch
    const staffRow = await this.db.query.staff.findFirst({
      where: and(
        eq(staff.id, staffId),
        eq(staff.branchId, branchId),
        eq(staff.isActive, true),
      ),
    });

    if (!staffRow) throw new BadRequestException('Invalid staff');

    // 3️⃣ Get services staff can perform
    const srvList = await this.db
      .select({
        id: services.id,
        name: services.name,
        durationMin: services.durationMin,
        priceCents: services.priceCents,

        category: {
          id: serviceCategories.id,
          name: serviceCategories.name,
          colorHex: serviceCategories.colorHex,
        },
      })
      .from(staffServices)
      .innerJoin(services, eq(services.id, staffServices.serviceId))
      .leftJoin(
        serviceCategories,
        eq(serviceCategories.id, services.categoryId),
      )
      .where(eq(staffServices.staffId, staffId));

    if (srvList.length === 0) return [];

    // 4️⃣ Get schedules
    const dayOfWeek = start.weekday % 7;

    const schedules = await this.db
      .select()
      .from(staffSchedules)
      .where(
        and(
          eq(staffSchedules.staffId, staffId),
          eq(staffSchedules.dayOfWeek, dayOfWeek),
        ),
      );

    if (schedules.length === 0) return [];

    // Build base free blocks
    let freeBlocks = schedules.map((s) => ({
      startMin: parseTimeToMinutes(s.startTime as any),
      endMin: parseTimeToMinutes(s.endTime as any),
    }));

    // 5️⃣ Get time-off
    const timeOff = await this.db
      .select()
      .from(staffTimeOff)
      .where(
        and(
          eq(staffTimeOff.staffId, staffId),
          lt(staffTimeOff.start, dayEnd.toUTC().toJSDate()),
          gte(staffTimeOff.end, dayStart.toUTC().toJSDate()),
        ),
      );

    const busyOff = timeOff.map((t) => ({
      startMin: dtToMinutesSinceDayStart(
        DateTime.fromJSDate(t.start).setZone(tz),
        dayStart,
      ),
      endMin: dtToMinutesSinceDayStart(
        DateTime.fromJSDate(t.end).setZone(tz),
        dayStart,
      ),
    }));

    freeBlocks = subtractBusy(freeBlocks, busyOff);

    // 6️⃣ Get existing appointments
    const appointmentsToday = await this.db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.staffId, staffId),
          eq(appointments.branchId, branchId),
          lt(appointments.start, dayEnd.toUTC().toJSDate()),
          gte(appointments.end, dayStart.toUTC().toJSDate()),
          inArray(appointments.status, [
            'PENDING',
            'CONFIRMED',
            'COMPLETED',
          ] as any),
        ),
      );

    const busyApps = appointmentsToday.map((a) => ({
      startMin: dtToMinutesSinceDayStart(
        DateTime.fromJSDate(a.start).setZone(tz),
        dayStart,
      ),
      endMin: dtToMinutesSinceDayStart(
        DateTime.fromJSDate(a.end).setZone(tz),
        dayStart,
      ),
    }));

    freeBlocks = subtractBusy(freeBlocks, busyApps);

    // 7️⃣ Check each service fits in the selected slot
    const startMin = dtToMinutesSinceDayStart(start, dayStart);

    return srvList.filter((s) => {
      const total = s.durationMin + bufferBefore + bufferAfter;
      const endMin = startMin + total;

      return freeBlocks.some(
        (b) => startMin >= b.startMin && endMin <= b.endMin,
      );
    });
  }

  async getAvailableServicesAt(params: { branchId: string; datetime: string }) {
    const { branchId, datetime } = params;

    // 1️⃣ Settings
    const settings = await this.db.query.branchSettings.findFirst({
      where: eq(branchSettings.branchId, branchId),
    });

    const tz = settings?.timezone ?? 'America/Mexico_City';

    const startLocal = DateTime.fromISO(datetime, { zone: tz });
    if (!startLocal.isValid) {
      throw new BadRequestException('Invalid datetime');
    }

    const date = startLocal.toISODate(); // YYYY-MM-DD

    // ⏱️ normalizar start al step de 15 min (UTC)
    const startUtcStep = startLocal
      .toUTC()
      .startOf('minute')
      .plus({ minutes: (15 - (startLocal.minute % 15)) % 15 })
      .toISO();

    // 2️⃣ Servicios activos del branch
    const activeServices = await this.db.query.services.findMany({
      where: and(eq(services.branchId, branchId), eq(services.isActive, true)),
      with: {
        category: true,
      },
    });

    if (!activeServices.length) return [];

    // 3️⃣ Resultado final
    const available: {
      id: string;
      name: string;
      durationMin: number;
      priceCents: number;
      categoryColor: string | null;
      allowAny: boolean;
      staff: {
        id: string;
        name: string;
        avatarUrl?: string | null;
      }[];
    }[] = [];

    // 4️⃣ Probar cada servicio
    for (const srv of activeServices) {
      try {
        const availability = await this.getAvailability({
          branchId,
          serviceId: srv.id,
          date,
        });

        // staff que pueden empezar EXACTAMENTE en este slot
        const eligibleStaffIds = availability.staff
          .filter((s) => s.slots.includes(startUtcStep))
          .map((s) => s.staffId);

        if (!eligibleStaffIds.length) continue;

        const staffMembers = await this.db.query.staff.findMany({
          where: and(
            eq(staff.branchId, branchId),
            inArray(staff.id, eligibleStaffIds),
            eq(staff.isActive, true),
          ),
        });

        available.push({
          id: srv.id,
          name: srv.name,
          durationMin: srv.durationMin,
          priceCents: srv.priceCents ?? 0,
          categoryColor: srv.category?.colorHex ?? null,

          allowAny: staffMembers.length > 1,

          staff: staffMembers.map((st) => ({
            id: st.id,
            name: st.name,
            avatarUrl: st.avatarUrl ?? null,
          })),
        });
      } catch {
        // si algo falla en disponibilidad → se ignora el servicio
        continue;
      }
    }

    return available;
  }
}
