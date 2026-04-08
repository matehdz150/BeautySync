import { Inject, Injectable } from '@nestjs/common';
import { BRANCHES_REPOSITORY } from '../../ports/tokens';
import * as branchesRepository from '../../ports/branches.repository';

import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import { CachePort } from 'src/modules/cache/core/ports/cache.port';
import { BranchCacheService } from 'src/modules/cache/application/branch-cache.service';

@Injectable()
export class UpdateBranchUseCase {
  constructor(
    @Inject(BRANCHES_REPOSITORY)
    private readonly repo: branchesRepository.BranchesRepository,

    @Inject(CACHE_PORT)
    private readonly cache: CachePort,

    private readonly branchCache: BranchCacheService,
  ) {}

  async execute(branchId: string, dto: branchesRepository.UpdateBranchInput) {
    const result = await this.repo.updateBranch(branchId, dto);

    // 🔥 solo invalidar si afecta explore
    if (dto.name !== undefined || dto.address !== undefined) {
      await Promise.all([
        this.cache.delPattern('explore:*'),
        this.branchCache.invalidate(result.organizationId),
      ]);
    }

    return result;
  }
}
