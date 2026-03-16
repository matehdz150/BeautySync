import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { StaffTimeOffRepository } from '../ports/staff-timeoff.repository.port';
import { STAFF_TIMEOFF_REPOSITORY } from '../ports/tokens';

@Injectable()
export class UpdateStaffTimeOffUseCase {
  constructor(
    @Inject(STAFF_TIMEOFF_REPOSITORY)
    private repo: StaffTimeOffRepository,
  ) {}

  async execute(params: {
    id: number;
    start?: Date;
    end?: Date;
    reason?: string;
  }) {
    if (params.start && params.end && params.start >= params.end) {
      throw new Error('Invalid time range');
    }

    const updated = await this.repo.update(params.id, {
      start: params.start,
      end: params.end,
      reason: params.reason,
    });

    if (!updated) {
      throw new NotFoundException('Time off not found');
    }

    return updated;
  }
}
