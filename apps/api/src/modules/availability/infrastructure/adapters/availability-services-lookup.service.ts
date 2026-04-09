import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

import { requestContext } from 'src/modules/metrics/request-context';

import { AvailabilityIndex } from '../../core/entities/availability-index.entity';
import { AvailabilityServicesSnapshot } from '../../core/entities/availability-services-snapshot.entity';
import { AvailabilityServicesRepository } from '../../core/ports/availability-services.repository';
import { AVAILABILITY_SERVICES_REPOSITORY } from '../../core/ports/tokens';
import { AvailabilityIndexCacheService } from './availability-index-cache.service';
import { buildAvailabilityServicesSnapshot } from './availability-services-snapshot.builder';
import { getAvailabilityWindowForDate } from './availability-window.helpers';

type GetSnapshotOptions = {
  allowWindowBuild?: boolean;
  windowPromises?: Map<string, Promise<AvailabilityIndex | null>>;
};

@Injectable()
export class AvailabilityServicesLookupService {
  constructor(
    @Inject(AVAILABILITY_SERVICES_REPOSITORY)
    private readonly servicesSnapshots: AvailabilityServicesRepository,
    private readonly availabilityIndexCache: AvailabilityIndexCacheService,
  ) {}

  async getCandidateSnapshots(branchId: string, start: DateTime) {
    const candidateDates = this.buildCandidateDates(start);
    const windowPromises = new Map<string, Promise<AvailabilityIndex | null>>();
    const snapshots = await Promise.all(
      candidateDates.map((date) =>
        this.getSnapshot(branchId, date, {
          allowWindowBuild: true,
          windowPromises,
        }),
      ),
    );

    return snapshots.filter(
      (snapshot): snapshot is AvailabilityServicesSnapshot => Boolean(snapshot),
    );
  }

  async getSnapshot(
    branchId: string,
    date: string,
    params?: GetSnapshotOptions,
  ): Promise<AvailabilityServicesSnapshot | null> {
    return requestContext.memo(
      `availability:services:lookup:${branchId}:${date}:${params?.allowWindowBuild ? 'build' : 'cached'}`,
      async () => {
        const cached = await this.servicesSnapshots.get(branchId, date);
        if (cached) {
          return cached;
        }

        const daySnapshot = await this.getDaySnapshotFromWindow(
          branchId,
          date,
          params,
        );
        if (!daySnapshot) {
          return null;
        }

        const servicesSnapshot = buildAvailabilityServicesSnapshot(daySnapshot);
        await this.servicesSnapshots.set(servicesSnapshot);
        return servicesSnapshot;
      },
    );
  }

  revalidateDate(branchId: string, date: string) {
    void this.getSnapshot(branchId, date, {
      allowWindowBuild: false,
    }).catch((error: unknown) => {
      console.error('[AvailabilityServices] REVALIDATE FAILED', {
        branchId,
        date,
        error,
      });
    });
  }

  private async getDaySnapshotFromWindow(
    branchId: string,
    date: string,
    params?: GetSnapshotOptions,
  ) {
    const window = await this.loadWindow(branchId, date, params);
    return window?.daySnapshots.get(date) ?? null;
  }

  private async loadWindow(
    branchId: string,
    date: string,
    params?: GetSnapshotOptions,
  ): Promise<AvailabilityIndex | null> {
    const window = getAvailabilityWindowForDate(date);
    const windowKey = `${branchId}:${window.startDate}:${window.endDate}:${params?.allowWindowBuild ? 'build' : 'cached'}`;
    const existing = params?.windowPromises?.get(windowKey);
    if (existing) {
      return existing;
    }

    const promise = params?.allowWindowBuild
      ? this.availabilityIndexCache.getAvailabilityWindow({
          branchId,
          start: window.start.toUTC().toJSDate(),
          end: window.end.toUTC().toJSDate(),
        })
      : this.availabilityIndexCache.getCached({
          branchId,
          start: window.start.toUTC().toJSDate(),
          end: window.end.toUTC().toJSDate(),
        });

    params?.windowPromises?.set(windowKey, promise);
    return promise;
  }

  private buildCandidateDates(start: DateTime) {
    const utc = start.toUTC().startOf('day');

    return [utc.minus({ days: 1 }), utc, utc.plus({ days: 1 })]
      .map((value) => value.toISODate())
      .filter((value): value is string => Boolean(value));
  }
}
