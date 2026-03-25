import { Inject, Injectable } from '@nestjs/common';
import { AVAILABILITY_REPOSITORY } from 'src/modules/availability/core/ports/tokens';
import * as availabilityRepository from '../../../../availability/core/ports/availability.repository';

@Injectable()
export class GetAvailableTimeOffStartSlotsUseCase {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepo: availabilityRepository.AvailabilityRepository,
  ) {}

  async execute(params: { branchId: string; staffId: string; date: string }) {
    const { branchId, staffId, date } = params;

    if (!branchId || !staffId || !date) {
      throw new Error('INVALID_INPUT');
    }

    // 🔥 usamos availability engine
    const availability = await this.availabilityRepo.getAvailability({
      branchId,
      staffId,
      date,
      requiredDurationMin: 15, // 👈 CLAVE
    });

    const staffAvailability = availability.staff.find(
      (s) => s.staffId === staffId,
    );

    if (!staffAvailability) {
      return { slots: [] };
    }

    return {
      slots: staffAvailability.slots,
    };
  }
}
