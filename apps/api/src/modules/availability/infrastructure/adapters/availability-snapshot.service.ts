import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

import { BranchServicesCacheService } from 'src/modules/cache/application/branch-services-cache.service';
import { BranchSettingsCacheService } from 'src/modules/cache/application/branch-settings-cache.service';
import { BranchStaffCacheService } from 'src/modules/cache/application/branch-staff-cache.service';

import { AvailabilityDaySnapshot } from '../../core/entities/availability-day-snapshot.entity';
import { AvailabilitySnapshotRepository } from '../../core/ports/availability-snapshot.repository';
import { AVAILABILITY_SNAPSHOT_REPOSITORY } from '../../core/ports/tokens';
import { BuildAvailabilitySnapshotUseCase } from '../../core/use-cases/build-availability-snapshot.use-case';
import { BuildAvailabilityIndexUseCase } from '../../core/use-cases/build-availability-index.use-case';
import { buildAvailabilityDaySnapshots } from './availability-day-snapshot.builder';

@Injectable()
export class AvailabilitySnapshotService {
  private readonly inflight = new Map<
    string,
    Promise<AvailabilityDaySnapshot>
  >();

  constructor(
    @Inject(AVAILABILITY_SNAPSHOT_REPOSITORY)
    private readonly snapshots: AvailabilitySnapshotRepository,
    private readonly buildAvailabilitySnapshot: BuildAvailabilitySnapshotUseCase,
    private readonly buildAvailabilityIndex: BuildAvailabilityIndexUseCase,
    private readonly branchSettingsCache: BranchSettingsCacheService,
    private readonly branchServicesCache: BranchServicesCacheService,
    private readonly branchStaffCache: BranchStaffCacheService,
  ) {}

  async getDaySnapshot(params: {
    branchId: string;
    date: string;
  }): Promise<AvailabilityDaySnapshot> {
    const cached = await this.snapshots.get(params.branchId, params.date);
    if (cached?.startsByStaff) {
      return cached;
    }

    const key = `${params.branchId}:${params.date}`;
    const existing = this.inflight.get(key);
    if (existing) {
      return existing;
    }

    const promise = this.buildDaySnapshot(params);
    this.inflight.set(key, promise);

    try {
      return await promise;
    } finally {
      if (this.inflight.get(key) === promise) {
        this.inflight.delete(key);
      }
    }
  }

  private async buildDaySnapshot(params: {
    branchId: string;
    date: string;
  }): Promise<AvailabilityDaySnapshot> {
    const timezone = await this.branchSettingsCache.getTimezone(
      params.branchId,
    );
    const localDay = DateTime.fromISO(params.date, { zone: timezone }).startOf(
      'day',
    );
    const start = localDay.toUTC().toJSDate();
    const end = localDay.endOf('day').toUTC().toJSDate();

    const rawSnapshot = await this.buildAvailabilitySnapshot.execute({
      branchId: params.branchId,
      start,
      end,
      dayOfWeeks: [localDay.weekday % 7],
    });
    const index = this.buildAvailabilityIndex.execute({
      snapshot: rawSnapshot,
      start,
      end,
    });
    const [services, staffRows] = await Promise.all([
      this.branchServicesCache.getActive(params.branchId),
      this.branchStaffCache.getByBranch(params.branchId),
    ]);

    const snapshot =
      buildAvailabilityDaySnapshots({
        branchId: params.branchId,
        index,
        services,
        staffRows,
      }).get(params.date) ??
      ({
        branchId: params.branchId,
        date: params.date,
        timezone,
        bufferBeforeMin: rawSnapshot.settings.bufferBeforeMin,
        bufferAfterMin: rawSnapshot.settings.bufferAfterMin,
        generatedAt: new Date().toISOString(),
        stepMin: 15,
        staff: [],
        services: [],
        startsByStaff: [],
      } satisfies AvailabilityDaySnapshot);

    await this.snapshots.set(snapshot);
    return snapshot;
  }
}
