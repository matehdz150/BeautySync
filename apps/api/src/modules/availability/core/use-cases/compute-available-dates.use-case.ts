import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

import { AvailabilitySnapshot } from '../entities/availability-snapshot.entity';
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
export class ComputeAvailableDatesUseCase {
  execute(params: {
    snapshot: AvailabilitySnapshot;
    dates: string[];
    requiredDurationMin: number;
    lockedByDate?: Map<string, Map<string, Set<number>>>;
  }) {
    const uniqueDates = [...new Set(params.dates)].filter(Boolean).sort();
    if (!uniqueDates.length) {
      return [];
    }

    const { snapshot } = params;
    const tz = snapshot.settings.timezone;
    const slotMin = 15;
    const slotsNeeded = Math.ceil(
      (params.requiredDurationMin +
        snapshot.settings.bufferBeforeMin +
        snapshot.settings.bufferAfterMin) /
        slotMin,
    );

    const dayContexts = uniqueDates.map((date) => {
      const dayStartLocal = DateTime.fromISO(date, { zone: tz }).startOf('day');
      const diffDays = dayStartLocal
        .diff(DateTime.now().setZone(tz).startOf('day'), 'days')
        .days;

      return {
        date,
        dayStartLocal,
        dayOfWeek: dayStartLocal.weekday % 7,
        isToday: dayStartLocal.hasSame(DateTime.now().setZone(tz), 'day'),
        isBeyondMaxAhead: diffDays > snapshot.settings.maxBookingAheadDays,
      };
    });

    const schedulesByStaffWeekday = new Map<string, Map<number, TimeBlock[]>>();
    for (const schedule of snapshot.schedules) {
      const byWeekday =
        schedulesByStaffWeekday.get(schedule.staffId) ?? new Map<number, TimeBlock[]>();
      const blocks = byWeekday.get(schedule.dayOfWeek) ?? [];

      blocks.push({
        startMin: parseTimeToMinutes(schedule.startTime),
        endMin: parseTimeToMinutes(schedule.endTime),
      });

      byWeekday.set(schedule.dayOfWeek, blocks);
      schedulesByStaffWeekday.set(schedule.staffId, byWeekday);
    }

    const dateSet = new Set(uniqueDates);
    const timeOffByStaffAndDate = this.groupBusy(snapshot.timeOffs, tz, dateSet);
    const appointmentsByStaffAndDate = this.groupBusy(
      snapshot.appointments,
      tz,
      dateSet,
    );

    return dayContexts.map((dayCtx) => {
      if (dayCtx.isBeyondMaxAhead) {
        return { date: dayCtx.date, available: false };
      }

      const noticeCutoffMin =
        dayCtx.isToday && snapshot.settings.minBookingNoticeMin > 0
          ? dtToMinutesSinceDayStart(DateTime.now().setZone(tz), dayCtx.dayStartLocal) +
            snapshot.settings.minBookingNoticeMin
          : 0;

      let available = false;

      for (const staff of snapshot.staff) {
        const schedules =
          schedulesByStaffWeekday.get(staff.id)?.get(dayCtx.dayOfWeek) ?? [];
        if (!schedules.length) {
          continue;
        }

        const locked =
          params.lockedByDate?.get(dayCtx.date)?.get(staff.id) ?? new Set<number>();
        const exclusions = mergeIntervals([
          ...(timeOffByStaffAndDate.get(staff.id)?.get(dayCtx.date) ?? []),
          ...(appointmentsByStaffAndDate.get(staff.id)?.get(dayCtx.date) ?? []),
        ]);
        const free = subtractIntervals(schedules, exclusions);

        for (const block of free) {
          const firstStart = Math.ceil(
            Math.max(block.startMin, noticeCutoffMin) / slotMin,
          ) * slotMin;
          const lastStart = block.endMin - slotsNeeded * slotMin;

          for (let start = firstStart; start <= lastStart; start += slotMin) {
            if (!locked.has(start)) {
              available = true;
              break;
            }
          }

          if (available) {
            break;
          }
        }

        if (available) {
          break;
        }
      }

      return { date: dayCtx.date, available };
    });
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

