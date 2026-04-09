import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';
import { StaffBranchSnapshotCacheService } from '../../infrastructure/adapters/staff-branch-snapshot-cache.service';

@Injectable()
export class GetStaffByBranchUseCase {
  constructor(private readonly snapshotCache: StaffBranchSnapshotCacheService) {}

  async execute(branchId: string, user: AuthenticatedUser) {
    return this.snapshotCache.get(branchId, user);
  }
}
