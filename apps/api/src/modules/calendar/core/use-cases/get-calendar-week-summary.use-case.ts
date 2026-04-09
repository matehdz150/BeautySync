import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

import { CalendarSnapshotCacheService } from '../../calendar-snapshot-cache.service';
import { CalendarSnapshot } from '../entities/calendar-snapshot.entity';

@Injectable()
export class GetCalendarWeekSummaryUseCase {
  constructor(private readonly calendarSnapshot: CalendarSnapshotCacheService) {}

  async execute(input: { branchId: string; date: string; staffId?: string }) {
    const { branchId, date, staffId } = input;

    if (!branchId) {
      throw new Error('branchId is required');
    }

    const monthSnapshot = await this.calendarSnapshot.getOrBuild({
      branchId,
      date,
    });
    const timezone = monthSnapshot.timezone;
    const selected = DateTime.fromISO(date, { zone: timezone });
    const weekStart = selected.startOf('week').plus({ days: 1 });
    const days = Array.from({ length: 7 }, (_, index) =>
      weekStart.plus({ days: index }),
    );
    const snapshots = new Map<string, CalendarSnapshot>([
      [monthSnapshot.month, monthSnapshot],
    ]);

    for (const day of days) {
      const month = day.toFormat('yyyy-MM');
      if (!snapshots.has(month)) {
        snapshots.set(
          month,
          await this.calendarSnapshot.getOrBuild({
            branchId,
            date: day.toISODate()!,
          }),
        );
      }
    }

    return {
      date,
      timezone,
      days: days.map((day) => ({
        date: day.toISODate()!,
        totalAppointments: this.getDailyCount({
          snapshot: snapshots.get(day.toFormat('yyyy-MM'))!,
          date: day.toISODate()!,
          staffId,
        }),
      })),
    };
  }

  private getDailyCount(params: {
    snapshot: CalendarSnapshot;
    date: string;
    staffId?: string;
  }) {
    const { snapshot, date, staffId } = params;

    if (!staffId) {
      return snapshot.weekSummary[date] ?? 0;
    }

    return (snapshot.eventsByDay[date] ?? []).filter(
      (event) => event.type === 'APPOINTMENT' && event.staffId === staffId,
    ).length;
  }
}
