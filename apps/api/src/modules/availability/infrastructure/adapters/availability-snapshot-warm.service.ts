import { Inject, Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { DateTime } from 'luxon';

import { AvailabilityIndexRepository } from '../../core/ports/availability-index.repository';
import { AvailabilityGeneratorService } from '../../core/ports/availability-generator.service';
import { AvailabilityServicesRepository } from '../../core/ports/availability-services.repository';
import { AvailabilitySnapshotRepository } from '../../core/ports/availability-snapshot.repository';
import {
  AVAILABILITY_GENERATOR_SERVICE,
  AVAILABILITY_INDEX_REPOSITORY,
  AVAILABILITY_SERVICES_REPOSITORY,
  AVAILABILITY_SNAPSHOT_REPOSITORY,
} from '../../core/ports/tokens';
import { AvailabilityIndexSlot } from '../../core/entities/availability-global-index.entity';
import { AvailabilityIndexCacheService } from './availability-index-cache.service';
import {
  getAvailabilityWindowForDate,
  getAvailabilityWindowsForRange,
} from './availability-window.helpers';

type EnqueueDayParams = {
  branchId: string;
  date: string;
};

type EnqueueWindowParams = {
  branchId: string;
  start: string;
  end: string;
};

@Injectable()
export class AvailabilitySnapshotWarmService {
  private readonly inflight = new Map<string, Promise<void>>();

  constructor(
    @Inject('AVAILABILITY_QUEUE')
    private readonly queue: Queue,
    @Inject(AVAILABILITY_GENERATOR_SERVICE)
    private readonly generator: AvailabilityGeneratorService,
    @Inject(AVAILABILITY_SNAPSHOT_REPOSITORY)
    private readonly snapshots: AvailabilitySnapshotRepository,
    @Inject(AVAILABILITY_INDEX_REPOSITORY)
    private readonly globalIndex: AvailabilityIndexRepository,
    @Inject(AVAILABILITY_SERVICES_REPOSITORY)
    private readonly servicesSnapshots: AvailabilityServicesRepository,
    private readonly availabilityIndexCache: AvailabilityIndexCacheService,
  ) {}

  async enqueueDay(params: EnqueueDayParams): Promise<void> {
    await this.queue.add('availability.snapshot.day', params, {
      jobId: `availability-snapshot-${params.branchId}-${params.date}`,
    });
  }

  async enqueueServicesDay(params: EnqueueDayParams): Promise<void> {
    await this.queue.add('availability.services.day', params, {
      jobId: `availability-services-${params.branchId}-${params.date}`,
    });
  }

  async enqueueWindow(params: EnqueueWindowParams): Promise<void> {
    const windows = getAvailabilityWindowsForRange({
      start: params.start,
      end: params.end,
    });

    await Promise.all(
      windows.map((window) =>
        this.queue.add(
          'availability.window',
          {
            branchId: params.branchId,
            start: window.startDate,
            end: window.endDate,
          },
          {
            jobId: `availability-window-${params.branchId}-${window.startDate}-${window.endDate}`,
          },
        ),
      ),
    );
  }

  async enqueueWindowForDate(params: EnqueueDayParams): Promise<void> {
    const window = getAvailabilityWindowForDate(params.date);
    await this.enqueueWindow({
      branchId: params.branchId,
      start: window.startDate,
      end: window.endDate,
    });
  }

  async enqueueRange(params: {
    branchId: string;
    start: string;
    end: string;
  }): Promise<void> {
    await this.enqueueWindow(params);
  }

  async enqueueNextDays(branchId: string, days = 14): Promise<void> {
    const start = DateTime.now().startOf('day');
    const end = start.plus({ days: Math.max(0, days - 1) });
    await this.enqueueRange({
      branchId,
      start: start.toISODate() ?? start.toFormat('yyyy-MM-dd'),
      end: end.toISODate() ?? end.toFormat('yyyy-MM-dd'),
    });
  }

  async warmDay(params: EnqueueDayParams): Promise<void> {
    await this.warmWindowForDate(params);

    const snapshot = await this.generator.generateForDay(
      params.branchId,
      params.date,
    );
    await this.snapshots.set(snapshot);
    await this.rebuildServicesDay(params);
    await this.rebuildGlobalIndex(params.branchId, 30);
  }

  async ensureDayReady(params: EnqueueDayParams): Promise<void> {
    const key = `${params.branchId}:${params.date}`;
    const existing = this.inflight.get(key);
    if (existing) {
      return existing;
    }

    const promise = (async () => {
      const daySnapshot = await this.snapshots.get(
        params.branchId,
        params.date,
      );
      if (!daySnapshot) {
        await this.warmDay(params);
        return;
      }

      const servicesSnapshot = await this.servicesSnapshots.get(
        params.branchId,
        params.date,
      );
      if (!servicesSnapshot) {
        await this.rebuildServicesDay(params);
      }
    })();

    this.inflight.set(key, promise);

    try {
      await promise;
    } finally {
      if (this.inflight.get(key) === promise) {
        this.inflight.delete(key);
      }
    }
  }

  async rebuildServicesDay(params: EnqueueDayParams): Promise<void> {
    await this.servicesSnapshots.buildFromSnapshot(
      params.branchId,
      params.date,
    );
  }

  async warmWindow(params: EnqueueWindowParams): Promise<void> {
    await this.availabilityIndexCache.getAvailabilityWindow({
      branchId: params.branchId,
      start: DateTime.fromISO(params.start).startOf('day').toUTC().toJSDate(),
      end: DateTime.fromISO(params.end).endOf('day').toUTC().toJSDate(),
    });
  }

  async warmWindowForDate(params: EnqueueDayParams): Promise<void> {
    const window = getAvailabilityWindowForDate(params.date);
    await this.warmWindow({
      branchId: params.branchId,
      start: window.startDate,
      end: window.endDate,
    });
  }

  async rebuildGlobalIndex(branchId: string, days = 30): Promise<void> {
    const start = DateTime.now().startOf('day');
    const end = start.plus({ days: Math.max(0, days - 1) });
    await this.globalIndex.buildIndex(
      branchId,
      start.toJSDate(),
      end.toJSDate(),
    );
  }

  async getGlobalAvailabilityRange(params: {
    branchId: string;
    start: Date;
    end: Date;
  }): Promise<AvailabilityIndexSlot[]> {
    return this.globalIndex.getRange(params.branchId, params.start, params.end);
  }

  async getNextGlobalAvailable(
    branchId: string,
    fromTimestamp = Date.now(),
  ): Promise<AvailabilityIndexSlot | null> {
    return this.globalIndex.getNextAvailable(branchId, fromTimestamp);
  }

  async invalidateGlobalIndex(branchId: string): Promise<void> {
    await this.globalIndex.invalidate(branchId);
  }
}
