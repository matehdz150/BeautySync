import { ForbiddenException, Inject, Injectable } from '@nestjs/common';

import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import { CachePort } from 'src/modules/cache/core/ports/cache.port';
import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

import { STAFF_REPOSITORY } from '../../core/ports/tokens';
import { StaffRepository } from '../../core/ports/staff.repository';
import { StaffListItem } from '../../core/entities/staff.entity';

@Injectable()
export class StaffBranchSnapshotCacheService {
  private static readonly TTL_SECONDS = 300;

  constructor(
    @Inject(STAFF_REPOSITORY)
    private readonly repo: StaffRepository,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async get(branchId: string, user: AuthenticatedUser): Promise<StaffListItem[]> {
    if (!user.hasBranchAccess(branchId)) {
      throw new ForbiddenException('You cannot access this branch');
    }

    const key = this.buildKey(branchId);
    const cached = await this.cache.get<StaffListItem[]>(key);
    if (cached) {
      return cached;
    }

    const snapshot = await this.repo.findSnapshotByBranch(branchId);
    await this.cache.set(key, snapshot, StaffBranchSnapshotCacheService.TTL_SECONDS);
    return snapshot;
  }

  async invalidate(branchId: string) {
    await this.cache.del(this.buildKey(branchId));
  }

  buildKey(branchId: string) {
    return `staff:snapshot:branch:${branchId}`;
  }
}
