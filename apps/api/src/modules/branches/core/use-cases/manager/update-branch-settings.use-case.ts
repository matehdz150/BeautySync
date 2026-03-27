import { Inject, Injectable } from '@nestjs/common';
import { BRANCH_SETTINGS_REPOSITORY } from '../../ports/tokens';
import * as branchSettingsRepository from '../../ports/branch-settings.repository';
import { UpdateBranchSettingsInput } from '../../ports/branch-settings.repository';

import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import { CachePort } from 'src/modules/cache/core/ports/cache.port';

@Injectable()
export class UpdateBranchSettingsUseCase {
  constructor(
    @Inject(BRANCH_SETTINGS_REPOSITORY)
    private readonly repo: branchSettingsRepository.BranchSettingsRepository,

    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(branchId: string, input: UpdateBranchSettingsInput) {
    // 1️⃣ update
    const result = await this.repo.update(branchId, input);

    // 2️⃣ invalidate explore cache
    await this.cache.delPattern('explore:*');

    return result;
  }
}
