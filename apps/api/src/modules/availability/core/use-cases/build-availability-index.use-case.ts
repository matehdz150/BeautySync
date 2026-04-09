import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

import { AvailabilitySnapshot } from '../entities/availability-snapshot.entity';
import {
  AvailabilityIndex,
  DayAvailability,
  TimeSlot,
} from '../entities/availability-index.entity';
import {
  dtToMinutesSinceDayStart,
  mergeIntervals,
  parseTimeToMinutes,
  subtractIntervals,
} from '../../infrastructure/adapters/time-helpers';

type TimeBlock = {
  startMin: number;
  endMin: number;
};

@Injectable()
export class BuildAvailabilityIndexUseCase {
  private static readonly SLOT_MIN = 15;

  execute(params: {
    snapshot: AvailabilitySnapshot;
    start: Date;
    end: Date;
  }): AvailabilityIndex {
    return this.build(params.snapshot, params.start, params.end);
  }

  build(
    snapshot: AvailabilitySnapshot,
    start: Date,
    end: Date,
  ): AvailabilityIndex {
    const tz = snapshot.settings.timezone;
    const nowLocal = DateTime.now().setZone(tz);
    const schedulesByStaffWeekday = new Map<string, Map<number, TimeBlock[]>>();

    for (const schedule of snapshot.schedules) {
      const byWeekday =
        schedulesByStaffWeekday.get(schedule.staffId) ??
        new Map<number, TimeBlock[]>();
      const blocks = byWeekday.get(schedule.dayOfWeek) ?? [];
      blocks.push({
        startMin: parseTimeToMinutes(schedule.startTime),
        endMin: parseTimeToMinutes(schedule.endTime),
      });
      byWeekday.set(schedule.dayOfWeek, blocks);
      schedulesByStaffWeekday.set(schedule.staffId, byWeekday);
    }

    const dateSet = this.buildDateSet(start, end, tz);
    const timeOffByStaffAndDate = this.groupBusy(snapshot.timeOffs, tz, dateSet);
    const appointmentsByStaffAndDate = this.groupBusy(
      snapshot.appointments,
      tz,
      dateSet,
    );

    const byDay = new Map<string, DayAvailability>();
    const availableDates: string[] = [];
    const staffIdsByService = new Map<string, string[]>();
    const serviceDurations = new Map<string, number>();
    const activeStaffIds = snapshot.staff.map((staff) => staff.id);
    for (const row of snapshot.staffServices) {
      const current = staffIdsByService.get(row.serviceId) ?? [];
      current.push(row.staffId);
      staffIdsByService.set(row.serviceId, current);
    }
    for (const service of snapshot.services) {
      serviceDurations.set(service.id, service.durationMin);
    }
    let cursor = DateTime.fromJSDate(start).setZone(tz).startOf('day');
    const lastDay = DateTime.fromJSDate(end).setZone(tz).startOf('day');

    while (cursor <= lastDay) {
      const date = cursor.toISODate()!;
      const dayOfWeek = cursor.weekday % 7;
      const noticeCutoffMin =
        cursor.hasSame(nowLocal, 'day') && snapshot.settings.minBookingNoticeMin > 0
          ? dtToMinutesSinceDayStart(nowLocal, cursor) +
            snapshot.settings.minBookingNoticeMin
          : 0;
      const slots: TimeSlot[] = [];
      const startsByStaff = new Map<string, number[]>();

      for (const staff of snapshot.staff) {
        const schedules =
          schedulesByStaffWeekday.get(staff.id)?.get(dayOfWeek) ?? [];
        if (!schedules.length) {
          continue;
        }

        const exclusions = mergeIntervals([
          ...(timeOffByStaffAndDate.get(staff.id)?.get(date) ?? []),
          ...(appointmentsByStaffAndDate.get(staff.id)?.get(date) ?? []),
        ]);
        const freeBlocks = subtractIntervals(schedules, exclusions);

        for (const block of freeBlocks) {
          const firstStart =
            Math.ceil(
              Math.max(block.startMin, noticeCutoffMin) /
                BuildAvailabilityIndexUseCase.SLOT_MIN,
            ) * BuildAvailabilityIndexUseCase.SLOT_MIN;

          for (
            let minute = firstStart;
            minute + BuildAvailabilityIndexUseCase.SLOT_MIN <= block.endMin;
            minute += BuildAvailabilityIndexUseCase.SLOT_MIN
          ) {
            const startAt = cursor.plus({ minutes: minute }).toUTC().toJSDate();
            const endAt = cursor
              .plus({ minutes: minute + BuildAvailabilityIndexUseCase.SLOT_MIN })
              .toUTC()
              .toJSDate();
            const starts = startsByStaff.get(staff.id) ?? [];
            starts.push(startAt.getTime());
            startsByStaff.set(staff.id, starts);

            slots.push({
              start: startAt,
              end: endAt,
              staffId: staff.id,
            });
          }
        }
      }

      byDay.set(date, {
        date,
        hasAvailability: slots.length > 0,
        slots,
        staffIds: [...startsByStaff.keys()],
        startsByStaff,
      });
      if (slots.length > 0) {
        availableDates.push(date);
      }

      cursor = cursor.plus({ days: 1 });
    }

    return {
      byDay,
      availableDates,
      staffIdsByService,
      serviceDurations,
      activeStaffIds,
      settings: snapshot.settings,
    };
  }

  private buildDateSet(start: Date, end: Date, tz: string) {
    const set = new Set<string>();
    let cursor = DateTime.fromJSDate(start).setZone(tz).startOf('day');
    const lastDay = DateTime.fromJSDate(end).setZone(tz).startOf('day');

    while (cursor <= lastDay) {
      set.add(cursor.toISODate()!);
      cursor = cursor.plus({ days: 1 });
    }

    return set;
  }

  private groupBusy(
    rows: Array<{ staffId: string; start: Date; end: Date }>,
    tz: string,
    dateSet: Set<string>,
  ) {
    const output = new Map<string, Map<string, TimeBlock[]>>();

    for (const row of rows) {
      const startLocal = DateTime.fromJSDate(row.start).setZone(tz);
      const endLocal = DateTime.fromJSDate(row.end).setZone(tz);
      if (endLocal <= startLocal) {
        continue;
      }

      let cursor = startLocal.startOf('day');
      const lastDay = endLocal.startOf('day');

      while (cursor <= lastDay) {
        const date = cursor.toISODate();
        if (!date || !dateSet.has(date)) {
          cursor = cursor.plus({ days: 1 });
          continue;
        }

        const dayStart = cursor;
        const dayEnd = cursor.endOf('day');
        const clampedStart = startLocal < dayStart ? dayStart : startLocal;
        const clampedEnd = endLocal > dayEnd ? dayEnd : endLocal;
        const startMin = dtToMinutesSinceDayStart(clampedStart, dayStart);
        const endMin = dtToMinutesSinceDayStart(clampedEnd, dayStart);

        if (startMin < endMin) {
          const byDate = output.get(row.staffId) ?? new Map<string, TimeBlock[]>();
          const intervals = byDate.get(date) ?? [];
          intervals.push({ startMin, endMin });
          byDate.set(date, intervals);
          output.set(row.staffId, byDate);
        }

        cursor = cursor.plus({ days: 1 });
      }
    }

    for (const byDate of output.values()) {
      for (const [date, intervals] of byDate.entries()) {
        byDate.set(date, mergeIntervals(intervals));
      }
    }

    return output;
  }
}
