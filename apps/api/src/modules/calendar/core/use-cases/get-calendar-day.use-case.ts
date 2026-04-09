// core/use-cases/get-calendar-day.use-case.ts

import { Injectable } from '@nestjs/common';

import { CalendarSnapshotCacheService } from '../../calendar-snapshot-cache.service';
import { AvailabilitySnapshotWarmService } from 'src/modules/availability/infrastructure/adapters/availability-snapshot-warm.service';

@Injectable()
export class GetCalendarDayUseCase {
  constructor(
    private readonly calendarSnapshot: CalendarSnapshotCacheService,
    private readonly availabilityWarm: AvailabilitySnapshotWarmService,
  ) {}

  async execute(input: { branchId: string; date: string; staffId?: string }) {
    const { branchId, date, staffId } = input;

    if (!branchId) {
      throw new Error('branchId is required');
    }

    const snapshot = await this.calendarSnapshot.getOrBuild({ branchId, date });
    const dayEvents = (snapshot.eventsByDay[date] ?? []).filter(
      (event) => !staffId || event.staffId === staffId,
    );
    const appointments = dayEvents.filter(
      (event): event is Extract<(typeof dayEvents)[number], { type: 'APPOINTMENT' }> =>
        event.type === 'APPOINTMENT',
    );
    const timeOffs = dayEvents.filter(
      (event): event is Extract<(typeof dayEvents)[number], { type: 'TIME_OFF' }> =>
        event.type === 'TIME_OFF',
    );

    const result = {
      date,
      timezone: snapshot.timezone,

      appointments,
      timeOffs,

      meta: {
        totalAppointments: appointments.length,
        totalTimeOffs: timeOffs.length,
      },
    };

    void this.availabilityWarm.enqueueDay({ branchId, date });

    return result;
  }
}
