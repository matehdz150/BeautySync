import { Inject, Injectable } from '@nestjs/common';

import { CACHE_PORT } from '../cache/core/ports/tokens';
import { CachePort } from '../cache/core/ports/cache.port';
import { CalendarEvent } from './core/entities/calendar-event.entity';

type CalendarDayPayload = {
  date: string;
  timezone: string;
  appointments: Extract<CalendarEvent, { type: 'APPOINTMENT' }>[];
  timeOffs: Extract<CalendarEvent, { type: 'TIME_OFF' }>[];
  meta: {
    totalAppointments: number;
    totalTimeOffs: number;
  };
};

@Injectable()
export class CalendarDayCacheService {
  private static readonly TTL_SECONDS = 45;

  constructor(
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async get(params: {
    branchId: string;
    date: string;
    staffId?: string;
  }): Promise<CalendarDayPayload | null> {
    return this.cache.get<CalendarDayPayload>(this.buildKey(params));
  }

  async set(
    params: {
      branchId: string;
      date: string;
      staffId?: string;
    },
    value: CalendarDayPayload,
  ) {
    await this.cache.set(
      this.buildKey(params),
      value,
      CalendarDayCacheService.TTL_SECONDS,
    );
  }

  async invalidate(params: { branchId: string; date?: string }) {
    if (params.date) {
      await this.cache.delPattern(
        `calendar:branch:${params.branchId}:day:${params.date}:staff:*`,
      );
      return;
    }

    await this.cache.delPattern(`calendar:branch:${params.branchId}:day:*`);
  }

  private buildKey(params: {
    branchId: string;
    date: string;
    staffId?: string;
  }) {
    return `calendar:branch:${params.branchId}:day:${params.date}:staff:${params.staffId ?? 'all'}`;
  }
}
