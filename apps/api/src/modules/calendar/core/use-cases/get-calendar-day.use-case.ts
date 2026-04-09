// core/use-cases/get-calendar-day.use-case.ts

import { Injectable } from '@nestjs/common';

import { CalendarSnapshotService } from '../../calendar-snapshot.service';

@Injectable()
export class GetCalendarDayUseCase {
  constructor(private readonly calendarSnapshot: CalendarSnapshotService) {}

  async execute(input: { branchId: string; date: string; staffId?: string }) {
    const { branchId, date, staffId } = input;

    if (!branchId) {
      throw new Error('branchId is required');
    }

    const snapshot = await this.calendarSnapshot.getDaySnapshot({
      branchId,
      date,
      fallbackToRecompute: false,
    });
    const appointments = snapshot.appointments.filter(
      (event) => !staffId || event.staffId === staffId,
    );
    const timeOffs = snapshot.timeOffs.filter(
      (event) => !staffId || event.staffId === staffId,
    );

    return {
      date,
      timezone: snapshot.timezone,
      appointments,
      timeOffs,
      meta: {
        totalAppointments: appointments.length,
        totalTimeOffs: timeOffs.length,
      },
    };
  }
}
