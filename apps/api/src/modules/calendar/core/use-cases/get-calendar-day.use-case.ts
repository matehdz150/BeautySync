// core/use-cases/get-calendar-day.use-case.ts

import { DateTime } from 'luxon';
import { CalendarEvent } from '../entities/calendar-event.entity';
import { BranchSettingsPort } from '../ports/branch-settings.port';
import {
  BRANCH_SETTINGS_PORT,
  CALENDAR_EVENTS_PORT,
} from '../ports/tokens';
import { Inject, Injectable } from '@nestjs/common';
import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import { CachePort } from 'src/modules/cache/core/ports/cache.port';
import { CalendarEventsPort } from '../ports/calendar-events.port';

@Injectable()
export class GetCalendarDayUseCase {
  constructor(
    @Inject(CALENDAR_EVENTS_PORT)
    private readonly events: CalendarEventsPort,

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

    const cacheKey = `calendar:day:${branchId}:${date}:${staffId ?? 'all'}`;
    const cached = await this.cache.get<{
      date: string;
      timezone: string;
      appointments: Extract<CalendarEvent, { type: 'APPOINTMENT' }>[];
      timeOffs: Extract<CalendarEvent, { type: 'TIME_OFF' }>[];
      meta: {
        totalAppointments: number;
        totalTimeOffs: number;
      };
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    const tz =
      (await this.branchSettings.getTimezone(branchId)) ??
      'America/Mexico_City';

    const start = DateTime.fromISO(date, { zone: tz }).startOf('day').toUTC();

    const end = start.plus({ days: 1 });

    const events = await this.events.findByBranchAndRange({
      branchId,
      staffId,
      start: start.toJSDate(),
      end: end.toJSDate(),
    });

    const appointments = events.filter(
      (event): event is Extract<CalendarEvent, { type: 'APPOINTMENT' }> =>
        event.type === 'APPOINTMENT',
    );
    const timeOffs = events.filter(
      (event): event is Extract<CalendarEvent, { type: 'TIME_OFF' }> =>
        event.type === 'TIME_OFF',
    );

    const result = {
      date,
      timezone: tz,

      appointments,
      timeOffs,

      meta: {
        totalAppointments: appointments.length,
        totalTimeOffs: timeOffs.length,
      },
    };

    await this.cache.set(cacheKey, result, 60);

    return result;
  }
}
