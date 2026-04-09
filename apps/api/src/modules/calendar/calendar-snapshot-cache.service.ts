import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

import { CACHE_PORT } from '../cache/core/ports/tokens';
import { CachePort } from '../cache/core/ports/cache.port';
import { BranchSettingsCacheService } from '../cache/application/branch-settings-cache.service';
import { CALENDAR_EVENTS_PORT } from './core/ports/tokens';
import { CalendarEventsPort } from './core/ports/calendar-events.port';
import { CalendarSnapshot, CalendarSnapshotEvent } from './core/entities/calendar-snapshot.entity';

@Injectable()
export class CalendarSnapshotCacheService {
  private static readonly TTL_SECONDS = 90;
  private readonly inflight = new Map<string, Promise<CalendarSnapshot>>();

  constructor(
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
    @Inject(CALENDAR_EVENTS_PORT)
    private readonly events: CalendarEventsPort,
    private readonly branchSettingsCache: BranchSettingsCacheService,
  ) {}

  async getOrBuild(params: {
    branchId: string;
    date: string;
  }): Promise<CalendarSnapshot> {
    const month = this.toMonth(params.date);
    const key = this.buildKey(params.branchId, month);
    const cached = await this.cache.get<CalendarSnapshot>(key);
    if (cached) {
      return cached;
    }

    const inflight = this.inflight.get(key);
    if (inflight) {
      return inflight;
    }

    const promise = this.buildSnapshot({
      branchId: params.branchId,
      month,
    });
    this.inflight.set(key, promise);

    try {
      const snapshot = await promise;
      await this.cache.set(key, snapshot, CalendarSnapshotCacheService.TTL_SECONDS);
      return snapshot;
    } finally {
      if (this.inflight.get(key) === promise) {
        this.inflight.delete(key);
      }
    }
  }

  async invalidate(params: { branchId: string; date?: string }) {
    if (params.date) {
      await this.cache.del(this.buildKey(params.branchId, this.toMonth(params.date)));
      return;
    }

    await this.cache.delPattern(`calendar:snapshot:${params.branchId}:*`);
  }

  private async buildSnapshot(params: {
    branchId: string;
    month: string;
  }): Promise<CalendarSnapshot> {
    const timezone = await this.branchSettingsCache.getTimezone(params.branchId);
    const monthStart = DateTime.fromFormat(params.month, 'yyyy-MM', {
      zone: timezone,
    }).startOf('month');
    const monthEnd = monthStart.endOf('month');

    const events = await this.events.findByBranchAndRange({
      branchId: params.branchId,
      start: monthStart.startOf('day').toUTC().toJSDate(),
      end: monthEnd.plus({ days: 1 }).startOf('day').toUTC().toJSDate(),
    });

    const eventsByDay: Record<string, CalendarSnapshotEvent[]> = {};
    const weekSummary: Record<string, number> = {};

    for (const event of events) {
      const start = event.start instanceof Date ? event.start : new Date(event.start);
      const end = event.end instanceof Date ? event.end : new Date(event.end);
      const day = DateTime.fromJSDate(start, { zone: 'utc' })
        .setZone(timezone)
        .toISODate();

      if (!day) {
        continue;
      }

      const bucket = eventsByDay[day] ?? [];

      if (event.type === 'TIME_OFF') {
        bucket.push({
          type: 'TIME_OFF',
          id: event.id,
          staffId: event.staffId,
          start: start.toISOString(),
          end: end.toISOString(),
          reason: event.reason,
        });
      } else {
        bucket.push({
          type: 'APPOINTMENT',
          id: event.id,
          staffId: event.staffId,
          bookingId: event.bookingId ?? null,
          start: start.toISOString(),
          end: end.toISOString(),
          clientName: event.clientName,
          serviceName: event.serviceName,
          color: event.color,
        });
        weekSummary[day] = (weekSummary[day] ?? 0) + 1;
      }

      eventsByDay[day] = bucket;
    }

    return {
      branchId: params.branchId,
      month: params.month,
      timezone,
      generatedAt: new Date().toISOString(),
      eventsByDay,
      weekSummary,
    };
  }

  private toMonth(date: string) {
    return date.slice(0, 7);
  }

  private buildKey(branchId: string, month: string) {
    return `calendar:snapshot:${branchId}:${month}`;
  }
}
