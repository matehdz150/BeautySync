import { Injectable } from '@nestjs/common';

import { AvailabilityResult, StaffAvailability } from '../entities/availability.entity';
import { AvailabilityIndex } from '../entities/availability-index.entity';
import { AvailabilitySnapshotSettings } from '../entities/availability-snapshot.entity';

@Injectable()
export class GetSlotsForDayFromIndexUseCase {
  execute(params: {
    index: AvailabilityIndex;
    date: string;
    branchId: string;
    settings: AvailabilitySnapshotSettings;
    requiredDurationMin: number;
    staffIds?: string[];
    lockedStartsByStaff?: Map<string, Set<string>>;
  }) {
    const slotMin = 15;
    const requiredSlots = Math.ceil(
      (params.requiredDurationMin +
        params.settings.bufferBeforeMin +
        params.settings.bufferAfterMin) /
        slotMin,
    );
    const day = params.index.byDay.get(params.date);

    if (!day?.slots.length) {
      return new AvailabilityResult(params.branchId, params.date, []);
    }

    const selectedStaffIds = params.staffIds?.length
      ? new Set(params.staffIds)
      : null;
    const startsByStaff = new Map<string, number[]>();
    const startSetByStaff = new Map<string, Set<number>>();

    for (const slot of day.slots) {
      if (selectedStaffIds && !selectedStaffIds.has(slot.staffId)) {
        continue;
      }

      const startMs = slot.start.getTime();
      const list = startsByStaff.get(slot.staffId) ?? [];
      list.push(startMs);
      startsByStaff.set(slot.staffId, list);

      const set = startSetByStaff.get(slot.staffId) ?? new Set<number>();
      set.add(startMs);
      startSetByStaff.set(slot.staffId, set);
    }

    const staffAvailability: StaffAvailability[] = [];

    for (const [staffId, starts] of startsByStaff.entries()) {
      const startSet = startSetByStaff.get(staffId) ?? new Set<number>();
      const locked = params.lockedStartsByStaff?.get(staffId) ?? new Set<string>();
      const visibleSlots: string[] = [];

      for (const startMs of starts) {
        const startIso = new Date(startMs).toISOString();
        if (locked.has(startIso)) {
          continue;
        }

        let valid = true;
        for (let offset = 1; offset < requiredSlots; offset++) {
          if (!startSet.has(startMs + offset * slotMin * 60_000)) {
            valid = false;
            break;
          }
        }

        if (valid) {
          visibleSlots.push(startIso);
        }
      }

      staffAvailability.push(new StaffAvailability(staffId, visibleSlots));
    }

    return new AvailabilityResult(params.branchId, params.date, staffAvailability);
  }
}
