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

    // 🔥 1. availability base
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

    // 🔥 2. ordenar slots
    const slots = [...staffAvailability.slots].sort();

    // 🔥 3. encontrar index del start
    const startIndex = slots.findIndex((s) => s === startISO);

    if (startIndex === -1) {
      return { endSlots: [] };
    }

    // 🔥 4. construir consecutivos
    const endSlots: string[] = [];

    let prev = DateTime.fromISO(startISO);

    for (let i = startIndex + 1; i < slots.length; i++) {
      const current = DateTime.fromISO(slots[i]);

      const diff = current.diff(prev, 'minutes').minutes;

      // ❌ rompe continuidad
      if (diff !== SLOT_MIN) break;

      // ✅ válido
      endSlots.push(current.toISO()!);

      prev = current;
    }

    return {
      endSlots,
    };
  }
}
