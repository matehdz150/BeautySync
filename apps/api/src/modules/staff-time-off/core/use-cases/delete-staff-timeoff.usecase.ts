import { Inject, Injectable } from '@nestjs/common';
import { StaffTimeOffRepository } from '../ports/staff-timeoff.repository.port';
import { STAFF_TIMEOFF_REPOSITORY } from '../ports/tokens';
import { AvailabilityCacheService } from 'src/modules/availability/infrastructure/adapters/availability-cache.service';
import { AvailabilitySnapshotWarmService } from 'src/modules/availability/infrastructure/adapters/availability-snapshot-warm.service';

@Injectable()
export class DeleteStaffTimeOffUseCase {
  constructor(
    @Inject(STAFF_TIMEOFF_REPOSITORY)
    private repo: StaffTimeOffRepository,
    private readonly availabilityCache: AvailabilityCacheService,
    private readonly availabilityWarm: AvailabilitySnapshotWarmService,
  ) {}

  async execute(id: number) {
    const existing = await this.repo.findById(id);
    await this.repo.delete(id);
    if (existing?.branchId) {
      const date = existing.start.toISOString().slice(0, 10);
      await this.availabilityCache.invalidate(existing.branchId, date);
      await this.availabilityWarm.enqueueWindowForDate({
        branchId: existing.branchId,
        date,
      });
    }

    return { success: true };
  }
}
