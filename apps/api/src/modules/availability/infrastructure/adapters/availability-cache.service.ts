import { Inject, Injectable } from '@nestjs/common';

import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import { CachePort } from 'src/modules/cache/core/ports/cache.port';

import { AvailabilityDaySnapshot } from '../../core/entities/availability-day-snapshot.entity';
import { AvailabilityIndex } from '../../core/entities/availability-index.entity';
import { AvailabilitySnapshotSettings } from '../../core/entities/availability-snapshot.entity';
import { getAvailabilityWindowForDate } from './availability-window.helpers';

type CachedAvailabilityWindow = {
  branchId: string;
  startDate: string;
  endDate: string;
  days: Record<
    string,
    {
      date: string;
      hasAvailability: boolean;
      slots: Array<{ start: string; end: string; staffId: string }>;
      staffIds?: string[];
      startsByStaff?: Array<[string, number[]]>;
    }
  >;
  availableDates: string[];
  staffIdsByService: Array<[string, string[]]>;
  serviceDurations: Array<[string, number]>;
  activeStaffIds: string[];
  settings: AvailabilitySnapshotSettings;
  daySnapshots?: Array<[string, AvailabilityDaySnapshot]>;
};

@Injectable()
export class AvailabilityCacheService {
  private static readonly TTL_SECONDS = 300;

  constructor(
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  buildKey(params: { branchId: string; startDate: string; endDate: string }) {
    return `availability:${params.branchId}:${params.startDate}:${params.endDate}`;
  }

  async getIndex(key: string): Promise<AvailabilityIndex | null> {
    const cached = await this.cache.get<CachedAvailabilityWindow>(key);
    if (!cached) {
      return null;
    }

    return {
      byDay: new Map(
        Object.values(cached.days).map((day) => {
          const slots = day.slots.map((slot) => ({
            ...slot,
            start: new Date(slot.start),
            end: new Date(slot.end),
          }));
          const startsByStaff = day.startsByStaff
            ? new Map(day.startsByStaff)
            : this.buildStartsByStaff(slots);

          return [
            day.date,
            {
              ...day,
              slots,
              staffIds: day.staffIds ?? [...startsByStaff.keys()],
              startsByStaff,
            },
          ] as const;
        }),
      ),
      availableDates: cached.availableDates,
      staffIdsByService: new Map(cached.staffIdsByService),
      serviceDurations: new Map(cached.serviceDurations),
      activeStaffIds: cached.activeStaffIds,
      settings: cached.settings,
      daySnapshots: new Map(cached.daySnapshots ?? []),
    };
  }

  async setIndex(key: string, index: AvailabilityIndex): Promise<void> {
    const [, branchId = '', startDate = '', endDate = ''] = key.split(':');

    await this.cache.set(
      key,
      {
        branchId,
        startDate,
        endDate,
        days: Object.fromEntries(
          [...index.byDay.values()].map((day) => [
            day.date,
            {
              ...day,
              slots: day.slots.map((slot) => ({
                ...slot,
                start: slot.start.toISOString(),
                end: slot.end.toISOString(),
              })),
              staffIds: day.staffIds,
              startsByStaff: [...day.startsByStaff.entries()],
            },
          ]),
        ),
        availableDates: index.availableDates,
        staffIdsByService: [...index.staffIdsByService.entries()],
        serviceDurations: [...index.serviceDurations.entries()],
        activeStaffIds: index.activeStaffIds,
        settings: index.settings,
        daySnapshots: [...index.daySnapshots.entries()],
      },
      AvailabilityCacheService.TTL_SECONDS,
    );
  }

  async invalidate(branchId: string, dates?: string | string[]): Promise<void> {
    const normalizedDates = Array.isArray(dates)
      ? [...new Set(dates.filter(Boolean))]
      : dates
        ? [dates]
        : [];

    if (normalizedDates.length > 0) {
      const windowKeys = normalizedDates.map((date) => {
        const window = getAvailabilityWindowForDate(date);
        return this.buildKey({
          branchId,
          startDate: window.startDate,
          endDate: window.endDate,
        });
      });

      await Promise.all([
        this.cache.del(`availability:index:${branchId}`),
        ...windowKeys.map((key) => this.cache.del(key)),
        ...normalizedDates.map((date) =>
          this.cache.del(`availability:${branchId}:${date}`),
        ),
        ...normalizedDates.map((date) =>
          this.cache.del(`availability:services:${branchId}:${date}`),
        ),
        ...normalizedDates.map((date) =>
          this.cache.delPattern(`manager:chain:*:${branchId}:${date}:*`),
        ),
        this.cache.delPattern(`availability_snapshot:${branchId}:*`),
      ]);
      return;
    }

    await Promise.all([
      this.cache.del(`availability:index:${branchId}`),
      this.cache.delPattern(`availability:${branchId}:*:*`),
      this.cache.delPattern(`availability:index:${branchId}:window:*`),
      this.cache.delPattern(`availability:services:${branchId}:*`),
      this.cache.delPattern(`availability:${branchId}:*`),
      this.cache.delPattern(`availability_snapshot:${branchId}:*`),
      this.cache.delPattern(`manager:chain:*:${branchId}:*`),
    ]);
  }

  private buildStartsByStaff(
    slots: Array<{ start: Date; end: Date; staffId: string }>,
  ) {
    const startsByStaff = new Map<string, number[]>();

    for (const slot of slots) {
      const starts = startsByStaff.get(slot.staffId) ?? [];
      starts.push(slot.start.getTime());
      startsByStaff.set(slot.staffId, starts);
    }

    return startsByStaff;
  }
}
