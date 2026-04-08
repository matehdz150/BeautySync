import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

import { AvailabilitySnapshot } from '../entities/availability-snapshot.entity';
import {
  dtToMinutesSinceDayStart,
  parseTimeToMinutes,
  subtractBusy,
} from '../../infrastructure/adapters/time-helpers';
import { AvailabilityResult, StaffAvailability } from '../entities/availability.entity';

type ComputeSlotsInput = {
  snapshot: AvailabilitySnapshot;
  date: string;
  requiredDurationMin: number;
  staffIds?: string[];
  lockedStartsByStaff?: Map<string, Set<string>>;
};

type TimeBlock = {
  startMin: number;
  endMin: number;
};

@Injectable()
export class ComputeSlotsForDayUseCase {
  execute(input: ComputeSlotsInput): AvailabilityResult {
    const { snapshot } = input;
    const tz = snapshot.settings.timezone;
    const slotMin = 15;
    const dayStartLocal = DateTime.fromISO(input.date, { zone: tz }).startOf('day');
    const dayEndLocal = dayStartLocal.endOf('day');
    const dayStartUtc = dayStartLocal.toUTC().toJSDate();
    const dayEndUtc = dayEndLocal.toUTC().toJSDate();
    const dayOfWeek = dayStartLocal.weekday % 7;
    const nowLocal = DateTime.now().setZone(tz);
    const slotsNeeded = Math.ceil(
      (input.requiredDurationMin +
        snapshot.settings.bufferBeforeMin +
        snapshot.settings.bufferAfterMin) /
        slotMin,
    );

    const selectedStaffIds = input.staffIds?.length
      ? new Set(input.staffIds)
      : null;

    const schedules = snapshot.schedules.filter(
      (schedule) =>
        schedule.dayOfWeek === dayOfWeek &&
        (!selectedStaffIds || selectedStaffIds.has(schedule.staffId)),
    );
    const timeOffs = snapshot.timeOffs.filter(
      (row) =>
        (!selectedStaffIds || selectedStaffIds.has(row.staffId)) &&
        row.start < dayEndUtc &&
        row.end >= dayStartUtc,
    );
    const appointments = snapshot.appointments.filter(
      (row) =>
        (!selectedStaffIds || selectedStaffIds.has(row.staffId)) &&
        row.start < dayEndUtc &&
        row.end >= dayStartUtc,
    );

    const staffRows = snapshot.staff.filter(
      (staff) => !selectedStaffIds || selectedStaffIds.has(staff.id),
    );

    const staffAvailability: StaffAvailability[] = [];

    for (const staff of staffRows) {
      const staffSchedules = schedules.filter((row) => row.staffId === staff.id);
      if (!staffSchedules.length) {
        staffAvailability.push(new StaffAvailability(staff.id, []));
        continue;
      }

      let freeBlocks: TimeBlock[] = staffSchedules.map((schedule) => ({
        startMin: parseTimeToMinutes(schedule.startTime),
        endMin: parseTimeToMinutes(schedule.endTime),
      }));

      const busyFromTimeOff = timeOffs
        .filter((row) => row.staffId === staff.id)
        .map((row) => {
          const start = DateTime.fromJSDate(row.start).setZone(tz);
          const end = DateTime.fromJSDate(row.end).setZone(tz);
          const clampedStart = start < dayStartLocal ? dayStartLocal : start;
          const clampedEnd = end > dayEndLocal ? dayEndLocal : end;
          return {
            startMin: dtToMinutesSinceDayStart(clampedStart, dayStartLocal),
            endMin: dtToMinutesSinceDayStart(clampedEnd, dayStartLocal),
          };
        })
        .filter((block) => block.startMin < block.endMin);

      freeBlocks = subtractBusy(freeBlocks, busyFromTimeOff);

      const busyFromAppointments = appointments
        .filter((row) => row.staffId === staff.id)
        .map((row) => ({
          startMin: dtToMinutesSinceDayStart(
            DateTime.fromJSDate(row.start).setZone(tz),
            dayStartLocal,
          ),
          endMin: dtToMinutesSinceDayStart(
            DateTime.fromJSDate(row.end).setZone(tz),
            dayStartLocal,
          ),
        }));

      freeBlocks = subtractBusy(freeBlocks, busyFromAppointments);

      let slotStarts: number[] = [];

      for (const block of freeBlocks) {
        for (let minute = block.startMin; minute + slotMin <= block.endMin; minute += slotMin) {
          slotStarts.push(minute);
        }
      }

      slotStarts = slotStarts.filter((startMin) =>
        freeBlocks.some(
          (block) =>
            startMin >= block.startMin &&
            startMin + slotsNeeded * slotMin <= block.endMin,
        ),
      );

      if (dayStartLocal.hasSame(nowLocal, 'day') && snapshot.settings.minBookingNoticeMin > 0) {
        const noticeCutoff =
          dtToMinutesSinceDayStart(nowLocal, dayStartLocal) +
          snapshot.settings.minBookingNoticeMin;
        slotStarts = slotStarts.filter((minute) => minute >= noticeCutoff);
      }

      const lockedStarts = input.lockedStartsByStaff?.get(staff.id) ?? new Set<string>();
      const slots = slotStarts
        .map((minute) => dayStartLocal.plus({ minutes: minute }).toUTC().toISO()!)
        .filter((slot) => !lockedStarts.has(slot));

      staffAvailability.push(new StaffAvailability(staff.id, slots));
    }

    return new AvailabilityResult(snapshot.branchId, input.date, staffAvailability);
  }
}
