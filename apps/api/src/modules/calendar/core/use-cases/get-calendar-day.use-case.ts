// core/use-cases/get-calendar-day.use-case.ts

import { DateTime } from 'luxon';
import { AppointmentsPort } from '../ports/appointments.port';
import { TimeOffPort } from '../ports/timeoff.port';
import { BranchSettingsPort } from '../ports/branch-settings.port';
import {
  APPOINTMENTS_PORT,
  BRANCH_SETTINGS_PORT,
  TIMEOFF_PORT,
} from '../ports/tokens';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetCalendarDayUseCase {
  constructor(
    @Inject(APPOINTMENTS_PORT)
    private readonly appointments: AppointmentsPort,

    @Inject(TIMEOFF_PORT)
    private readonly timeOffs: TimeOffPort,

    @Inject(BRANCH_SETTINGS_PORT)
    private readonly branchSettings: BranchSettingsPort,
  ) {}

  async execute(input: { branchId: string; date: string; staffId?: string }) {
    const { branchId, date, staffId } = input;

    if (!branchId) {
      throw new Error('branchId is required');
    }

    // =========================
    // TIMEZONE SAFE RANGE
    // =========================
    const tz =
      (await this.branchSettings.getTimezone(branchId)) ??
      'America/Mexico_City';

    const start = DateTime.fromISO(date, { zone: tz }).startOf('day').toUTC();

    const end = start.plus({ days: 1 });

    // =========================
    // FETCH
    // =========================
    const [appointments, timeOffs] = await Promise.all([
      this.appointments.findByBranchAndRange({
        branchId,
        staffId,
        start: start.toJSDate(),
        end: end.toJSDate(),
      }),

      this.timeOffs.findByBranchAndRange({
        branchId,
        staffId,
        start: start.toJSDate(),
        end: end.toJSDate(),
      }),
    ]);

    // =========================
    // RESPONSE (SEPARADO)
    // =========================
    return {
      date,
      timezone: tz,

      appointments,
      timeOffs,

      meta: {
        totalAppointments: appointments.length,
        totalTimeOffs: timeOffs.length,
      },
    };
  }
}
