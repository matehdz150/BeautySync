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

type EnqueueDayParams = {
  branchId: string;
  date: string;
};

@Injectable()
export class AvailabilitySnapshotWarmService {
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

  async enqueueRange(params: {
    branchId: string;
    start: string;
    end: string;
  }): Promise<void> {
    let cursor = DateTime.fromISO(params.start).startOf('day');
    const lastDay = DateTime.fromISO(params.end).startOf('day');

    while (cursor <= lastDay) {
      const date = cursor.toISODate();
      if (date) {
        await this.enqueueDay({
          branchId: params.branchId,
          date,
        });
      }
      cursor = cursor.plus({ days: 1 });
    }
  }

  async enqueueNextDays(branchId: string, days = 14): Promise<void> {
    const start = DateTime.now().startOf('day');
    const end = start.plus({ days: Math.max(0, days - 1) });
    await this.enqueueRange({
      branchId,
      start: start.toISODate() as string,
      end: end.toISODate() as string,
    });
  }

  async warmDay(params: EnqueueDayParams): Promise<void> {
    const snapshot = await this.generator.generateForDay(
      params.branchId,
      params.date,
    );
    await this.snapshots.set(snapshot);
    await this.rebuildServicesDay(params);
    await this.rebuildGlobalIndex(params.branchId, 30);
  }

  async rebuildServicesDay(params: EnqueueDayParams): Promise<void> {
    await this.servicesSnapshots.buildFromSnapshot(params.branchId, params.date);
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
