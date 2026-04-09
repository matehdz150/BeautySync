import { Inject, Injectable } from '@nestjs/common';

import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import { CachePort } from 'src/modules/cache/core/ports/cache.port';
import { BranchStaffCacheService } from 'src/modules/cache/application/branch-staff-cache.service';
import { BranchServicesCacheService } from 'src/modules/cache/application/branch-services-cache.service';
import { requestContext } from 'src/modules/metrics/request-context';

import { AvailabilityEngine } from '../../infrastructure/adapters/availability-engine.service';
import {
  AvailabilitySnapshot,
  AvailabilitySnapshotStaffService,
} from '../entities/availability-snapshot.entity';

type BuildSnapshotInput = {
  branchId: string;
  start: Date;
  end: Date;
  serviceIds?: string[];
  staffIds?: string[];
  dayOfWeeks: number[];
};

type CachedAvailabilitySnapshot = Omit<
  AvailabilitySnapshot,
  'rangeStartUtc' | 'rangeEndUtc' | 'timeOffs' | 'appointments'
> & {
  rangeStartUtc: string;
  rangeEndUtc: string;
  timeOffs: Array<{ staffId: string; start: string; end: string }>;
  appointments: Array<{
    staffId: string;
    start: string;
    end: string;
    status?: string;
  }>;
};

@Injectable()
export class BuildAvailabilitySnapshotUseCase {
  private static readonly TTL_SECONDS = 20;

  constructor(
    private readonly availabilityEngine: AvailabilityEngine,
    private readonly branchStaffCache: BranchStaffCacheService,
    private readonly branchServicesCache: BranchServicesCacheService,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(input: BuildSnapshotInput): Promise<AvailabilitySnapshot> {
    const normalizedStaffIds = input.staffIds
      ? [...new Set(input.staffIds)].sort()
      : [];
    const normalizedServiceIds = input.serviceIds
      ? [...new Set(input.serviceIds)].sort()
      : [];
    const normalizedDayOfWeeks = [...new Set(input.dayOfWeeks)].sort(
      (a, b) => a - b,
    );

    const requestKey = `availability_snapshot:request:${this.buildKey({
      ...input,
      staffIds: normalizedStaffIds,
      serviceIds: normalizedServiceIds,
      dayOfWeeks: normalizedDayOfWeeks,
    })}`;

    return requestContext.memo(requestKey, async () => {
      const cacheKey = `availability_snapshot:${this.buildKey({
        ...input,
        staffIds: normalizedStaffIds,
        serviceIds: normalizedServiceIds,
        dayOfWeeks: normalizedDayOfWeeks,
      })}`;

      const cached =
        await this.cache.get<CachedAvailabilitySnapshot>(cacheKey);
      if (cached) {
        return this.revive(cached);
      }

      const branchStaff = await this.branchStaffCache.getByBranch(input.branchId);
      const activeStaff = branchStaff.filter((row) => row.isActive);
      const activeStaffIds = new Set(activeStaff.map((row) => row.id));
      const selectedStaffIds = normalizedStaffIds.length
        ? normalizedStaffIds.filter((staffId) => activeStaffIds.has(staffId))
        : activeStaff.map((row) => row.id);

      const settings = await this.availabilityEngine.getBranchSettings(
        input.branchId,
      );

      if (!selectedStaffIds.length) {
        const empty: AvailabilitySnapshot = {
          branchId: input.branchId,
          rangeStartUtc: input.start,
          rangeEndUtc: input.end,
          settings,
          staff: [],
          schedules: [],
          timeOffs: [],
          appointments: [],
          services: [],
          staffServices: [],
        };

        await this.cache.set(cacheKey, this.serialize(empty), BuildAvailabilitySnapshotUseCase.TTL_SECONDS);
        return empty;
      }

      const activeServices = (await this.branchServicesCache.getActive(input.branchId))
        .filter((service) => service.isActive);
      const servicesForSnapshot = normalizedServiceIds.length
        ? activeServices
            .filter((service) => normalizedServiceIds.includes(service.id))
            .map((service) => ({
              id: service.id,
              durationMin: service.durationMin,
            }))
        : activeServices.map((service) => ({
            id: service.id,
            durationMin: service.durationMin,
          }));
      const serviceIdsForSnapshot = servicesForSnapshot.map((service) => service.id);

      const [schedules, timeOffs, appointments, eligibleStaffByServices] =
        await Promise.all([
          this.availabilityEngine.getSchedules(
            selectedStaffIds,
            normalizedDayOfWeeks,
          ),
          this.availabilityEngine.getTimeOff(
            selectedStaffIds,
            input.start,
            input.end,
          ),
          this.availabilityEngine.getAppointments(
            input.branchId,
            selectedStaffIds,
            input.start,
            input.end,
          ),
          serviceIdsForSnapshot.length
            ? this.availabilityEngine.getEligibleStaffByServices(
                input.branchId,
                serviceIdsForSnapshot,
              )
            : Promise.resolve(new Map<string, string[]>()),
        ]);

      const staffServices: AvailabilitySnapshotStaffService[] =
        serviceIdsForSnapshot.flatMap((serviceId) =>
          (eligibleStaffByServices.get(serviceId) ?? []).map((staffId) => ({
            serviceId,
            staffId,
          })),
        );

      const snapshot: AvailabilitySnapshot = {
        branchId: input.branchId,
        rangeStartUtc: input.start,
        rangeEndUtc: input.end,
        settings,
        staff: activeStaff.filter((row) => selectedStaffIds.includes(row.id)),
        schedules,
        timeOffs,
        appointments,
        services: servicesForSnapshot,
        staffServices,
      };

      await this.cache.set(
        cacheKey,
        this.serialize(snapshot),
        BuildAvailabilitySnapshotUseCase.TTL_SECONDS,
      );

      return snapshot;
    });
  }

  private buildKey(input: {
    branchId: string;
    start: Date;
    end: Date;
    serviceIds: string[];
    staffIds: string[];
    dayOfWeeks: number[];
  }) {
    return [
      input.branchId,
      input.start.toISOString(),
      input.end.toISOString(),
      input.dayOfWeeks.join(',') || 'all-days',
      input.serviceIds.join(',') || 'all-services',
      input.staffIds.join(',') || 'all-staff',
    ].join(':');
  }

  private serialize(snapshot: AvailabilitySnapshot): CachedAvailabilitySnapshot {
    return {
      ...snapshot,
      rangeStartUtc: snapshot.rangeStartUtc.toISOString(),
      rangeEndUtc: snapshot.rangeEndUtc.toISOString(),
      timeOffs: snapshot.timeOffs.map((row) => ({
        ...row,
        start: row.start.toISOString(),
        end: row.end.toISOString(),
      })),
      appointments: snapshot.appointments.map((row) => ({
        ...row,
        start: row.start.toISOString(),
        end: row.end.toISOString(),
      })),
    };
  }

  private revive(snapshot: CachedAvailabilitySnapshot): AvailabilitySnapshot {
    return {
      ...snapshot,
      rangeStartUtc: new Date(snapshot.rangeStartUtc),
      rangeEndUtc: new Date(snapshot.rangeEndUtc),
      timeOffs: snapshot.timeOffs.map((row) => ({
        ...row,
        start: new Date(row.start),
        end: new Date(row.end),
      })),
      appointments: snapshot.appointments.map((row) => ({
        ...row,
        start: new Date(row.start),
        end: new Date(row.end),
      })),
    };
  }
}
