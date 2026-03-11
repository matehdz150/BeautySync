import { Inject, Injectable } from '@nestjs/common';
import { STAFF_REPOSITORY } from '../ports/tokens';
import * as staffRepository from '../ports/staff.repository';
import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';
import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import * as cachePort from 'src/modules/cache/core/ports/cache.port';
import { StaffListItem } from '../entities/staff.entity';

@Injectable()
export class GetStaffByBranchUseCase {
  constructor(
    @Inject(STAFF_REPOSITORY)
    private readonly repo: staffRepository.StaffRepository,

    @Inject(CACHE_PORT)
    private readonly cache: cachePort.CachePort,
  ) {}

  async execute(branchId: string, user: AuthenticatedUser) {
    const key = `staff:branch:${branchId}`;

    const cached = await this.cache.get<StaffListItem[]>(key);

    if (cached) {
      return cached;
    }

    const staff = await this.repo.findByBranch(branchId, user);

    await this.cache.set(key, staff, 300);

    return staff;
  }
}
