import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

import { BranchServicesCacheService } from 'src/modules/cache/application/branch-services-cache.service';
import { BranchStaffCacheService } from 'src/modules/cache/application/branch-staff-cache.service';

import { AvailabilityDaySnapshot } from '../../core/entities/availability-day-snapshot.entity';
import { AvailabilityGeneratorService } from '../../core/ports/availability-generator.service';
import { AvailabilityIndex } from '../../core/entities/availability-index.entity';
import { AvailabilityIndexCacheService } from './availability-index-cache.service';

@Injectable()
export class AvailabilitySnapshotGeneratorService implements AvailabilityGeneratorService {
  private static readonly SLOT_MIN = 15;

  constructor(
    private readonly availabilityIndexCache: AvailabilityIndexCacheService,
    private readonly branchServicesCache: BranchServicesCacheService,
    private readonly branchStaffCache: BranchStaffCacheService,
  ) {}

  async generateForDay(
    branchId: string,
    date: string,
  ): Promise<AvailabilityDaySnapshot> {
    const branchDay = DateTime.fromISO(date).startOf('day');
    const monthStart = branchDay.startOf('month').toUTC().toJSDate();
    const monthEnd = branchDay.endOf('month').toUTC().toJSDate();

    const index = await this.availabilityIndexCache.getOrBuild({
      branchId,
      start: monthStart,
      end: monthEnd,
    });

    const cachedSnapshot = index.daySnapshots.get(date);
    if (cachedSnapshot) {
      return cachedSnapshot;
    }

    const [services, staffRows] = await Promise.all([
      this.branchServicesCache.getActive(branchId),
      this.branchStaffCache.getByBranch(branchId),
    ]);

    return this.buildDaySnapshot({
      branchId,
      date,
      index,
      services,
      staffRows,
    });
  }

  async generateForRange(
    branchId: string,
    start: string,
    end: string,
  ): Promise<AvailabilityDaySnapshot[]> {
    const snapshots: AvailabilityDaySnapshot[] = [];
    let cursor = DateTime.fromISO(start).startOf('day');
    const lastDay = DateTime.fromISO(end).startOf('day');

    while (cursor <= lastDay) {
      snapshots.push(
        await this.generateForDay(branchId, cursor.toISODate() as string),
      );
      cursor = cursor.plus({ days: 1 });
    }

    return snapshots;
  }

  private buildDaySnapshot(params: {
    branchId: string;
    date: string;
    index: AvailabilityIndex;
    services: Awaited<ReturnType<BranchServicesCacheService['getActive']>>;
    staffRows: Awaited<ReturnType<BranchStaffCacheService['getByBranch']>>;
  }): AvailabilityDaySnapshot {
    const { index } = params;
    const day = index.byDay.get(params.date);
    const activeStaff = params.staffRows.filter((staff) => staff.isActive);
    const activeStaffById = new Map(
      activeStaff.map((member) => [member.id, member]),
    );
    const dayStaffIds = day?.staffIds ?? [];
    const dayStartsByStaff = day?.startsByStaff ?? new Map<string, number[]>();
    const startSetByStaff = new Map(
      [...dayStartsByStaff.entries()].map(([staffId, starts]) => [
        staffId,
        new Set(starts),
      ]),
    );

    const staff = dayStaffIds
      .map((staffId) => activeStaffById.get(staffId))
      .filter((member): member is NonNullable<(typeof activeStaff)[number]> =>
        Boolean(member),
      )
      .map((member) => ({
        id: member.id,
        name: member.name,
        avatarUrl: member.avatarUrl ?? null,
      }));

    const services = params.services
      .filter((service) => service.isActive)
      .flatMap((service) => {
        const eligibleStaffIds = index.staffIdsByService.get(service.id) ?? [];
        if (!eligibleStaffIds.length) {
          return [];
        }

        const requiredSlots = Math.ceil(
          (service.durationMin +
            index.settings.bufferBeforeMin +
            index.settings.bufferAfterMin) /
            AvailabilitySnapshotGeneratorService.SLOT_MIN,
        );

        const availableStaffIdsByStart = new Map<number, string[]>();

        for (const staffId of eligibleStaffIds) {
          const starts = dayStartsByStaff.get(staffId) ?? [];
          const startSet = startSetByStaff.get(staffId);
          if (!starts.length || !startSet) {
            continue;
          }

          for (const startMs of starts) {
            let valid = true;
            for (let offset = 1; offset < requiredSlots; offset += 1) {
              if (
                !startSet.has(
                  startMs +
                    offset *
                      AvailabilitySnapshotGeneratorService.SLOT_MIN *
                      60_000,
                )
              ) {
                valid = false;
                break;
              }
            }

            if (!valid) {
              continue;
            }

            const staffIds = availableStaffIdsByStart.get(startMs) ?? [];
            staffIds.push(staffId);
            availableStaffIdsByStart.set(startMs, staffIds);
          }
        }

        if (!availableStaffIdsByStart.size) {
          return [];
        }

        return [
          {
            id: service.id,
            name: service.name,
            durationMin: service.durationMin,
            priceCents: service.priceCents ?? 0,
            categoryId: service.categoryId ?? null,
            categoryName: service.categoryName ?? null,
            categoryColor: service.categoryColor ?? null,
            availableStaffIdsByStart: [
              ...availableStaffIdsByStart.entries(),
            ].sort((a, b) => a[0] - b[0]),
          },
        ];
      });

    return {
      branchId: params.branchId,
      date: params.date,
      timezone: index.settings.timezone,
      bufferBeforeMin: index.settings.bufferBeforeMin,
      bufferAfterMin: index.settings.bufferAfterMin,
      generatedAt: new Date().toISOString(),
      stepMin: AvailabilitySnapshotGeneratorService.SLOT_MIN,
      staff,
      services,
    };
  }
}
