import { Inject, Injectable } from '@nestjs/common';
import { StaffTimeOffRepository } from '../ports/staff-timeoff.repository.port';
import { STAFF_TIMEOFF_REPOSITORY } from '../ports/tokens';
import { AvailabilityCacheService } from 'src/modules/availability/infrastructure/adapters/availability-cache.service';

@Injectable()
export class DeleteStaffTimeOffUseCase {
  constructor(
    @Inject(STAFF_TIMEOFF_REPOSITORY)
    private repo: StaffTimeOffRepository,
    private readonly availabilityCache: AvailabilityCacheService,
  ) {}

  async execute(id: number) {
    const existing = await this.repo.findById(id);
    await this.repo.delete(id);
    if (existing?.branchId) {
      await this.availabilityCache.invalidate(existing.branchId);
    }

    return { success: true };
  }
}
