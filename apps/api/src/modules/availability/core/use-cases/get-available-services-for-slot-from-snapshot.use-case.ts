import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

import { SLOT_LOCK_PORT } from 'src/modules/cache/core/ports/tokens';
import { SlotLockPort } from 'src/modules/cache/core/ports/slot-lock.port';

import { GetAvailabilityForSlotDto } from '../../application/dto/get-availability-for-slot.dto';
import { AvailabilityIndex } from '../entities/availability-index.entity';
import { AvailabilityDaySnapshot } from '../entities/availability-day-snapshot.entity';
import { AvailabilityServicesSnapshot } from '../entities/availability-services-snapshot.entity';
import { AvailabilitySnapshotRepository } from '../ports/availability-snapshot.repository';
import { AvailabilityServicesRepository } from '../ports/availability-services.repository';
import {
  AVAILABILITY_SERVICES_REPOSITORY,
  AVAILABILITY_SNAPSHOT_REPOSITORY,
} from '../ports/tokens';
import { AvailabilityIndexCacheService } from '../../infrastructure/adapters/availability-index-cache.service';
import { buildAvailabilityServicesSnapshot } from '../../infrastructure/adapters/availability-services-snapshot.builder';
import { getAvailabilityWindowForDate } from '../../infrastructure/adapters/availability-window.helpers';

@Injectable()
export class GetAvailableServicesForSlotFromSnapshotUseCase {
  constructor(
    @Inject(AVAILABILITY_SERVICES_REPOSITORY)
    private readonly servicesSnapshots: AvailabilityServicesRepository,
    @Inject(AVAILABILITY_SNAPSHOT_REPOSITORY)
    private readonly daySnapshots: AvailabilitySnapshotRepository,
    private readonly availabilityIndexCache: AvailabilityIndexCacheService,
    @Inject(SLOT_LOCK_PORT)
    private readonly slotLock: SlotLockPort,
  ) {}

  async execute(dto: GetAvailabilityForSlotDto) {
    const normalizedStart = this.normalizeStart(dto.datetime);
    const targetStartIso = normalizedStart.toUTC().toISO();
    if (!targetStartIso) {
      return [];
    }

    const windowPromises = new Map<string, Promise<AvailabilityIndex | null>>();

    for (const date of this.buildCandidateDates(normalizedStart)) {
      const snapshot = await this.loadServicesSnapshot({
        branchId: dto.branchId,
        date,
        windowPromises,
      });

      if (!snapshot) {
        continue;
      }

      const services = await this.computeAvailableServices({
        snapshot,
        branchId: dto.branchId,
        staffId: dto.staffId,
        targetStartIso,
      });

      if (services.length > 0) {
        return services;
      }
    }

    return [];
  }

  private normalizeStart(datetime: string) {
    const hasExplicitZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(datetime);
    const parsed = hasExplicitZone
      ? DateTime.fromISO(datetime, { setZone: true })
      : DateTime.fromISO(datetime);

    if (!parsed.isValid) {
      throw new BadRequestException('Invalid datetime');
    }

    const local = parsed.startOf('minute');
    const extraMinutes = (15 - (local.minute % 15)) % 15;
    return local.plus({ minutes: extraMinutes });
  }

  private buildCandidateDates(start: DateTime) {
    const utc = start.toUTC().startOf('day');

    return [utc.minus({ days: 1 }), utc, utc.plus({ days: 1 })]
      .map((value) => value.toISODate())
      .filter((value): value is string => Boolean(value));
  }

  private async loadServicesSnapshot(params: {
    branchId: string;
    date: string;
    windowPromises: Map<string, Promise<AvailabilityIndex | null>>;
  }): Promise<AvailabilityServicesSnapshot | null> {
    const cached = await this.servicesSnapshots.get(
      params.branchId,
      params.date,
    );
    if (cached) {
      console.log('[AvailabilityServices]', {
        event: 'services_snapshot_hit',
        branchId: params.branchId,
        date: params.date,
      });
      return cached;
    }

    console.log('[AvailabilityServices]', {
      event: 'services_snapshot_miss',
      branchId: params.branchId,
      date: params.date,
    });

    const daySnapshot =
      (await this.loadDaySnapshotFromCache(params.branchId, params.date)) ??
      (await this.loadDaySnapshotFromCachedWindow(params));

    if (!daySnapshot) {
      return null;
    }

    const snapshot = buildAvailabilityServicesSnapshot(daySnapshot);
    await this.servicesSnapshots.set(snapshot);
    return snapshot;
  }

  private async loadDaySnapshotFromCache(branchId: string, date: string) {
    const snapshot = await this.daySnapshots.get(branchId, date);
    return snapshot?.startsByStaff ? snapshot : null;
  }

  private async loadDaySnapshotFromCachedWindow(params: {
    branchId: string;
    date: string;
    windowPromises: Map<string, Promise<AvailabilityIndex | null>>;
  }): Promise<AvailabilityDaySnapshot | null> {
    const window = getAvailabilityWindowForDate(params.date);
    const windowKey = `${params.branchId}:${window.startDate}:${window.endDate}`;
    const existing = params.windowPromises.get(windowKey);

    const promise =
      existing ??
      this.availabilityIndexCache.getCached({
        branchId: params.branchId,
        start: window.start.toUTC().toJSDate(),
        end: window.end.toUTC().toJSDate(),
      });

    if (!existing) {
      params.windowPromises.set(windowKey, promise);
    }

    const index = await promise;
    if (!index) {
      console.log('[AvailabilityServices]', {
        event: 'window_cache_miss',
        branchId: params.branchId,
        date: params.date,
        startDate: window.startDate,
        endDate: window.endDate,
      });
      return null;
    }

    console.log('[AvailabilityServices]', {
      event: 'window_cache_hit',
      branchId: params.branchId,
      date: params.date,
      startDate: window.startDate,
      endDate: window.endDate,
    });

    return index.daySnapshots.get(params.date) ?? null;
  }

  private async computeAvailableServices(params: {
    snapshot: AvailabilityServicesSnapshot;
    branchId: string;
    staffId: string;
    targetStartIso: string;
  }) {
    const lockedStarts = await this.getLockedStarts(params);
    const matches = params.snapshot.services.flatMap((service) => {
      const slot = service.availableSlots.find(
        (candidate) =>
          candidate.start === params.targetStartIso &&
          candidate.staffIds.includes(params.staffId),
      );

      if (!slot) {
        return [];
      }

      return [{ service, slot }];
    });

    const unlocked = matches.map(({ service, slot }) => {
      const totalDuration = Math.max(
        DateTime.fromISO(slot.end, { zone: 'utc' }).diff(
          DateTime.fromISO(slot.start, { zone: 'utc' }),
          'minutes',
        ).minutes,
        0,
      );

      if (
        this.isRangeLocked({
          lockedStarts,
          startIso: params.targetStartIso,
          durationMin: totalDuration,
          stepMin: 15,
        })
      ) {
        return null;
      }

      return {
        id: service.serviceId,
        name: service.serviceName,
        durationMin: service.durationMin,
        priceCents: service.priceCents,
        category: {
          id: service.category?.id ?? null,
          name: service.category?.name ?? null,
          colorHex: service.category?.colorHex ?? null,
        },
      };
    });

    return unlocked.filter(
      (
        service,
      ): service is {
        id: string;
        name: string;
        durationMin: number;
        priceCents: number;
        category: {
          id: string | null;
          name: string | null;
          colorHex: string | null;
        };
      } => Boolean(service),
    );
  }

  private async getLockedStarts(params: {
    snapshot: AvailabilityServicesSnapshot;
    branchId: string;
    staffId: string;
  }) {
    const lockedByStaff = await this.slotLock.listLockedStarts({
      branchId: params.branchId,
      staffIds: [params.staffId],
      date: params.snapshot.date,
    });

    return lockedByStaff.get(params.staffId) ?? new Set<string>();
  }

  private isRangeLocked(params: {
    lockedStarts: Set<string>;
    startIso: string;
    durationMin: number;
    stepMin: number;
  }) {
    if (!params.lockedStarts.size) {
      return false;
    }

    const start = DateTime.fromISO(params.startIso, { zone: 'utc' });
    const end = start.plus({ minutes: params.durationMin });
    let cursor = start;

    while (cursor < end) {
      const slotIso = cursor.toUTC().toISO();
      if (slotIso && params.lockedStarts.has(slotIso)) {
        return true;
      }

      cursor = cursor.plus({ minutes: params.stepMin });
    }

    return false;
  }
}
