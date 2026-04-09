import { Injectable } from '@nestjs/common';

import { AvailabilityIndex } from '../entities/availability-index.entity';

@Injectable()
export class GetAvailableDatesFromIndexUseCase {
  execute(params: {
    index: AvailabilityIndex;
    dates: string[];
    requiredDurationMin: number;
    staffId?: string;
  }) {
    const slotMin = 15;
    const requiredSlots = Math.ceil(
      (params.requiredDurationMin +
        params.index.settings.bufferBeforeMin +
        params.index.settings.bufferAfterMin) /
        slotMin,
    );

    return params.dates.map((date) => {
      const day = params.index.byDay.get(date);
      if (!day?.staffIds.length) {
        return { date, available: false };
      }

      const startsByStaff = new Map<string, number[]>();
      const startSetByStaff = new Map<string, Set<number>>();

      if (day.startsByStaff.size) {
        for (const [staffId, starts] of day.startsByStaff.entries()) {
          if (params.staffId && staffId !== params.staffId) {
            continue;
          }

          startsByStaff.set(staffId, starts);
          startSetByStaff.set(staffId, new Set(starts));
        }
      } else {
        for (const slot of day.slots) {
          if (params.staffId && slot.staffId !== params.staffId) {
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
      }

      let available = false;

      for (const [staffId, starts] of startsByStaff.entries()) {
        const startSet = startSetByStaff.get(staffId) ?? new Set<number>();

        for (const startMs of starts) {
          let valid = true;
          for (let offset = 1; offset < requiredSlots; offset++) {
            if (!startSet.has(startMs + offset * slotMin * 60_000)) {
              valid = false;
              break;
            }
          }

          if (valid) {
            available = true;
            break;
          }
        }

        if (available) {
          break;
        }
      }

      return { date, available };
    });
  }
}
