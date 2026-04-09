import type { CachedBranchService } from 'src/modules/cache/application/branch-services-cache.service';
import type { CachedBranchStaff } from 'src/modules/cache/application/branch-staff-cache.service';

import type { AvailabilityDaySnapshot } from '../../core/entities/availability-day-snapshot.entity';
import type { AvailabilityIndex } from '../../core/entities/availability-index.entity';

const SLOT_MIN = 15;

export function buildAvailabilityDaySnapshots(params: {
  branchId: string;
  index: AvailabilityIndex;
  services: CachedBranchService[];
  staffRows: CachedBranchStaff[];
}): Map<string, AvailabilityDaySnapshot> {
  const snapshots = new Map<string, AvailabilityDaySnapshot>();
  const activeStaff = params.staffRows.filter((staff) => staff.isActive);
  const activeStaffById = new Map(
    activeStaff.map((member) => [member.id, member]),
  );

  for (const [date, day] of params.index.byDay.entries()) {
    const dayStaffIds = day.staffIds ?? [];
    const dayStartsByStaff = day.startsByStaff ?? new Map<string, number[]>();
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
        const eligibleStaffIds =
          params.index.staffIdsByService.get(service.id) ?? [];
        if (!eligibleStaffIds.length) {
          return [];
        }

        const requiredSlots = Math.ceil(
          (service.durationMin +
            params.index.settings.bufferBeforeMin +
            params.index.settings.bufferAfterMin) /
            SLOT_MIN,
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
              if (!startSet.has(startMs + offset * SLOT_MIN * 60_000)) {
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

    snapshots.set(date, {
      branchId: params.branchId,
      date,
      timezone: params.index.settings.timezone,
      bufferBeforeMin: params.index.settings.bufferBeforeMin,
      bufferAfterMin: params.index.settings.bufferAfterMin,
      generatedAt: new Date().toISOString(),
      stepMin: SLOT_MIN,
      staff,
      services,
    });
  }

  return snapshots;
}
