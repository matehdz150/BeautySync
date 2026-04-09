import { Inject, Injectable } from '@nestjs/common';
import { redis } from '../queues/redis/redis.provider';
import { CACHE_PORT } from '../cache/core/ports/tokens';
import { CachePort } from '../cache/core/ports/cache.port';
import { DateTime } from 'luxon';
import { CalendarSnapshotService } from './calendar-snapshot.service';
import { BranchSettingsCacheService } from '../cache/application/branch-settings-cache.service';

type CalendarRealtimeTimeOff = {
  id: number;
  staffId: string;
  start: string;
  end: string;
  reason?: string;
};

type CalendarInvalidatePatch = {
  entityType: 'TIME_OFF';
  operation: 'created' | 'updated' | 'deleted';
  staffId: string;
  start: string;
  end: string;
  timeOffs?: CalendarRealtimeTimeOff[];
  removedTimeOffIds?: number[];
  previousStart?: string;
  previousEnd?: string;
  previousTimeOffId?: number;
};

@Injectable()
export class CalendarRealtimePublisher {
  constructor(
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
    private readonly calendarSnapshot: CalendarSnapshotService,
    private readonly branchSettingsCache: BranchSettingsCacheService,
  ) {}

  async emitInvalidate(params: {
    branchId: string;
    reason: string;
    date?: string;
    start?: string;
    end?: string;
    invalidateWeekSummary?: boolean;
    patch?: CalendarInvalidatePatch;
  }) {
    const {
      branchId,
      reason,
      date,
      start,
      end,
      invalidateWeekSummary = true,
      patch,
    } = params;
    if (!branchId) return;

    try {
      const affectedDates = await this.resolveAffectedDates({
        branchId,
        date,
        start: start ?? patch?.start,
        end: end ?? patch?.end,
        previousStart: patch?.previousStart,
        previousEnd: patch?.previousEnd,
      });

      const invalidations: Promise<void>[] = [];

      if (affectedDates.length > 0) {
        await this.calendarSnapshot.recompute({
          branchId,
          dates: affectedDates,
        });

        for (const affectedDate of affectedDates) {
          invalidations.push(
            this.cache.delPattern(
              `calendar:branch:${branchId}:day:${affectedDate}:staff:*`,
            ),
          );
        }
      } else {
        invalidations.push(this.calendarSnapshot.invalidate({ branchId }));
        invalidations.push(
          this.cache.delPattern(`calendar:branch:${branchId}:date:*`),
        );
        invalidations.push(
          this.cache.delPattern(`calendar:branch:${branchId}:day:*`),
        );
      }

      if (invalidateWeekSummary) {
        invalidations.push(
          this.cache.delPattern(`calendar:week:${branchId}:*`),
        );
        invalidations.push(this.cache.delPattern(`calendar:day:${branchId}:*`));
      }

      await Promise.all(invalidations);

      await redis.publish(
        'realtime.calendar',
        JSON.stringify({
          branchId,
          event: 'calendar.invalidate',
          data: {
            branchId,
            reason,
            at: new Date().toISOString(),
            ...(patch
              ? {
                  staffId: patch.staffId,
                  start: patch.start,
                  end: patch.end,
                  patch,
                }
              : {}),
          },
        }),
      );
    } catch (error) {
      console.error('calendar realtime publish failed', error);
    }
  }

  private async resolveAffectedDates(params: {
    branchId: string;
    date?: string;
    start?: string;
    end?: string;
    previousStart?: string;
    previousEnd?: string;
  }) {
    if (params.date) {
      const normalizedDate = DateTime.fromISO(params.date).toISODate();
      return normalizedDate ? [normalizedDate] : [];
    }

    const timezone = await this.branchSettingsCache.getTimezone(
      params.branchId,
    );
    const dates = new Set<string>();

    this.appendDatesForRange(dates, timezone, params.start, params.end);
    this.appendDatesForRange(
      dates,
      timezone,
      params.previousStart,
      params.previousEnd,
    );

    return [...dates];
  }

  private appendDatesForRange(
    dates: Set<string>,
    timezone: string,
    start?: string,
    end?: string,
  ) {
    if (!start || !end) {
      return;
    }

    let cursor = DateTime.fromISO(start, { zone: 'utc' })
      .setZone(timezone)
      .startOf('day');
    const lastDay = DateTime.fromISO(end, { zone: 'utc' })
      .setZone(timezone)
      .startOf('day');

    while (cursor <= lastDay) {
      const isoDate = cursor.toISODate();
      if (isoDate) {
        dates.add(isoDate);
      }

      cursor = cursor.plus({ days: 1 });
    }
  }
}
