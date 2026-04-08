import { Inject, Injectable } from '@nestjs/common';

import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import { CachePort } from 'src/modules/cache/core/ports/cache.port';

import { AvailabilityIndex } from '../../core/entities/availability-index.entity';
import { AvailabilitySnapshotSettings } from '../../core/entities/availability-snapshot.entity';

type CachedAvailabilityIndex = {
  byDay: Array<{
    date: string;
    hasAvailability: boolean;
    slots: Array<{ start: string; end: string; staffId: string }>;
  }>;
  availableDates: string[];
  staffIdsByService: Array<[string, string[]]>;
  serviceDurations: Array<[string, number]>;
  activeStaffIds: string[];
  settings: AvailabilitySnapshotSettings;
};

@Injectable()
export class AvailabilityCacheService {
  private static readonly TTL_SECONDS = 45;

  constructor(
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  buildKey(params: { branchId: string; startDate: string; endDate: string }) {
    return `availability:index:${params.branchId}:window:${params.startDate}:${params.endDate}`;
  }

  async getIndex(key: string): Promise<AvailabilityIndex | null> {
    const cached = await this.cache.get<CachedAvailabilityIndex>(key);
    if (!cached) {
      return null;
    }

    return {
      byDay: new Map(
        cached.byDay.map((day) => [
          day.date,
          {
            ...day,
            slots: day.slots.map((slot) => ({
              ...slot,
              start: new Date(slot.start),
              end: new Date(slot.end),
            })),
          },
        ]),
      ),
      availableDates: cached.availableDates,
      staffIdsByService: new Map(cached.staffIdsByService),
      serviceDurations: new Map(cached.serviceDurations),
      activeStaffIds: cached.activeStaffIds,
      settings: cached.settings,
    };
  }

  async setIndex(key: string, index: AvailabilityIndex): Promise<void> {
    await this.cache.set(
      key,
      {
        byDay: [...index.byDay.values()].map((day) => ({
          ...day,
          slots: day.slots.map((slot) => ({
            ...slot,
            start: slot.start.toISOString(),
            end: slot.end.toISOString(),
          })),
        })),
        availableDates: index.availableDates,
        staffIdsByService: [...index.staffIdsByService.entries()],
        serviceDurations: [...index.serviceDurations.entries()],
        activeStaffIds: index.activeStaffIds,
        settings: index.settings,
      },
      AvailabilityCacheService.TTL_SECONDS,
    );
  }

  async invalidate(branchId: string): Promise<void> {
    await this.cache.delPattern(`availability:index:${branchId}:window:*`);
  }
}
