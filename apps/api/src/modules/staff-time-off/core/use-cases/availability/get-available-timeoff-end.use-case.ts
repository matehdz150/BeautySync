import { Inject, Injectable } from '@nestjs/common';
import { AVAILABILITY_REPOSITORY } from 'src/modules/availability/core/ports/tokens';
import * as availabilityRepository from '../../../../availability/core/ports/availability.repository';
import { DateTime } from 'luxon';

const SLOT_MIN = 15;

@Injectable()
export class GetAvailableTimeOffEndSlotsUseCase {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepo: availabilityRepository.AvailabilityRepository,
  ) {}

  async execute(params: {
    branchId: string;
    staffId: string;
    date: string;
    startISO: string;
  }) {
    const { branchId, staffId, date, startISO } = params;

    if (!branchId || !staffId || !date || !startISO) {
      throw new Error('INVALID_INPUT');
    }

    const availability = await this.availabilityRepo.getAvailability({
      branchId,
      staffId,
      date,
      requiredDurationMin: 15,
    });

    const staffAvailability = availability.staff.find(
      (s) => s.staffId === staffId,
    );

    if (!staffAvailability) {
      return { endSlots: [] };
    }

    const slots = [...staffAvailability.slots].sort();
    const startIndex = slots.findIndex((s) => s === startISO);

    if (startIndex === -1) {
      return { endSlots: [] };
    }

    const endSlots: string[] = [];

    let prevStart = DateTime.fromISO(startISO, { zone: 'utc' });

    // el primer fin válido siempre es start + 15
    endSlots.push(prevStart.plus({ minutes: SLOT_MIN }).toISO()!);

    for (let i = startIndex + 1; i < slots.length; i++) {
      const currentStart = DateTime.fromISO(slots[i], { zone: 'utc' });

      const diff = currentStart.diff(prevStart, 'minutes').minutes;

      if (diff !== SLOT_MIN) break;

      endSlots.push(currentStart.plus({ minutes: SLOT_MIN }).toISO()!);
      prevStart = currentStart;
    }

    return {
      endSlots,
    };
  }
}
