/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import * as client from 'src/db/client';
import {
  appointments,
  branchSettings,
  services,
  staff,
  staffSchedules,
  staffTimeOff,
  staffServices,
} from 'src/db/schema';
import { and, eq, inArray, lt, gte } from 'drizzle-orm';
import { GetAvailabilityDto } from './dto/create-availability.dto';
import {
  dtToMinutesSinceDayStart,
  parseTimeToMinutes,
  subtractBusy,
} from './time-helpers';
import { DateTime } from 'luxon';

type StaffAvailability = {
  staffId: string;
  slots: string[];
};

@Injectable()
export class AvailabilityService {
  constructor(@Inject('DB') private db: client.DB) {}

  async getAvailability(query: GetAvailabilityDto) {
    const { branchId, serviceId, date, staffId } = query;
    const SLOT_MIN = 15;

    // 1️⃣ Servicio
    const service = await this.db.query.services.findFirst({
      where: and(eq(services.id, serviceId), eq(services.branchId, branchId)),
    });

    if (!service)
      throw new BadRequestException('Service not found for this branch');
    if (!service.durationMin)
      throw new BadRequestException('Service duration not configured');

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
      (service.durationMin + bufferBefore + bufferAfter) / SLOT_MIN,
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
      const canDo = await this.db.query.staffServices.findFirst({
        where: and(
          eq(staffServices.staffId, staffId),
          eq(staffServices.serviceId, serviceId),
        ),
      });

      const staffRow = await this.db.query.staff.findFirst({
        where: and(
          eq(staff.id, staffId),
          eq(staff.branchId, branchId),
          eq(staff.isActive, true),
        ),
      });

      if (!canDo || !staffRow)
        throw new BadRequestException(
          'Staff is not active in this branch or cannot perform this service',
        );

      staffIds = [staffId];
    } else {
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
        .where(eq(staffServices.serviceId, serviceId));

      staffIds = [...new Set(staffWithService.map((s) => s.staffId))];
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
          inArray(appointments.status, [
            'PENDING',
            'CONFIRMED',
            'COMPLETED',
          ] as any),
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
}
