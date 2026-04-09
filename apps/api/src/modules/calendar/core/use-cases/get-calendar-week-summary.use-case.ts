import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

import { CalendarSnapshotService } from '../../calendar-snapshot.service';
import { CalendarDaySnapshot } from '../entities/calendar-day-snapshot.entity';

@Injectable()
export class GetCalendarWeekSummaryUseCase {
  constructor(private readonly calendarSnapshot: CalendarSnapshotService) {}

  async execute(input: { branchId: string; date: string; staffId?: string }) {
    const { branchId, date, staffId } = input;

    if (!branchId) {
      throw new Error('branchId is required');
    }

    const selectedSnapshot = await this.calendarSnapshot.getDaySnapshot({
      branchId,
      date,
      fallbackToRecompute: false,
    });
    const timezone = selectedSnapshot.timezone;
    const selected = DateTime.fromISO(date, { zone: timezone });
    const weekStart = selected.startOf('week').plus({ days: 1 });
    const days = Array.from({ length: 7 }, (_, index) =>
      weekStart.plus({ days: index }),
    );
    const daySnapshots = await this.calendarSnapshot.getDaySnapshots({
      branchId,
      dates: days.map((day) => day.toISODate()!),
      fallbackToRecompute: false,
    });
    const snapshots = new Map<string, CalendarDaySnapshot>(
      daySnapshots.map((snapshot) => [snapshot.date, snapshot]),
    );

    return {
      date,
      timezone,
      days: days.map((day) => ({
        date: day.toISODate()!,
        totalAppointments: this.getDailyCount({
          snapshot: snapshots.get(day.toISODate()!)!,
          staffId,
        }),
      })),
    };
  }

  private getDailyCount(params: {
    snapshot: CalendarDaySnapshot;
    staffId?: string;
  }) {
    const { snapshot, staffId } = params;

    if (!staffId) {
      return snapshot.meta.totalAppointments;
    }

    return snapshot.appointments.filter((event) => event.staffId === staffId)
      .length;
  }
}
