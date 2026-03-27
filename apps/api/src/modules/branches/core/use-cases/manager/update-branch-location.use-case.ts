import { Inject, Injectable } from '@nestjs/common';
import { BRANCHES_REPOSITORY } from '../../ports/tokens';
import * as branchesRepository from '../../ports/branches.repository';

import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import { CachePort } from 'src/modules/cache/core/ports/cache.port';

@Injectable()
export class UpdateBranchLocationUseCase {
  constructor(
    @Inject(BRANCHES_REPOSITORY)
    private readonly repo: branchesRepository.BranchesRepository,

    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(
    branchId: string,
    dto: branchesRepository.UpdateBranchLocationInput,
  ) {
    // 1️⃣ actualizar
    const result = await this.repo.updateLocation(branchId, dto);

    // 2️⃣ invalidar cache explore
    await this.cache.delPattern('explore:*');

    return result;
  }
}
