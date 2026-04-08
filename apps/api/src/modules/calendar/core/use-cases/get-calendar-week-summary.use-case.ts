import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

import { AppointmentsPort } from '../ports/appointments.port';
import { BranchSettingsPort } from '../ports/branch-settings.port';
import { APPOINTMENTS_PORT, BRANCH_SETTINGS_PORT } from '../ports/tokens';
import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import { CachePort } from 'src/modules/cache/core/ports/cache.port';

@Injectable()
export class GetCalendarWeekSummaryUseCase {
  constructor(
    @Inject(APPOINTMENTS_PORT)
    private readonly appointments: AppointmentsPort,

    @Inject(BRANCH_SETTINGS_PORT)
    private readonly branchSettings: BranchSettingsPort,

    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(input: { branchId: string; date: string; staffId?: string }) {
    const { branchId, date, staffId } = input;

    if (!branchId) {
      throw new Error('branchId is required');
    }

    const timezone =
      (await this.branchSettings.getTimezone(branchId)) ??
      'America/Mexico_City';

    const selected = DateTime.fromISO(date, { zone: timezone });
    const weekStart = selected.startOf('week').plus({ days: 1 });
    const days = Array.from({ length: 7 }, (_, index) =>
      weekStart.plus({ days: index }),
    );
    const rangeStart = days[0].startOf('day').toUTC();
    const rangeEnd = rangeStart.plus({ days: 7 });
    const cacheKey = `calendar:week:${branchId}:${days[0].toISODate()!}:${days[6].toISODate()!}:${staffId ?? 'all'}`;
    const cached = await this.cache.get<{
      date: string;
      timezone: string;
      days: {
        date: string;
        totalAppointments: number;
      }[];
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    const counts = await this.appointments.countDailyByBranchAndRange({
      branchId,
      staffId,
      timezone,
      start: rangeStart.toJSDate(),
      end: rangeEnd.toJSDate(),
    });
    const countsByDate = new Map(
      counts.map((entry) => [entry.date, entry.totalAppointments]),
    );

    const result = {
      date,
      timezone,
      days: days.map((day) => ({
        date: day.toISODate()!,
        totalAppointments: countsByDate.get(day.toISODate()!) ?? 0,
      })),
    };

    await this.cache.set(cacheKey, result, 60);

    return result;
  }
}
