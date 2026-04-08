import { Inject, Injectable } from '@nestjs/common';
import { BRANCH_SETTINGS_REPOSITORY } from '../../ports/tokens';
import * as branchSettingsRepository from '../../ports/branch-settings.repository';
import { UpdateBranchSettingsInput } from '../../ports/branch-settings.repository';

import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import { CachePort } from 'src/modules/cache/core/ports/cache.port';
import { BranchSettingsCacheService } from 'src/modules/cache/application/branch-settings-cache.service';
import { AvailabilityCacheService } from 'src/modules/availability/infrastructure/adapters/availability-cache.service';

@Injectable()
export class UpdateBranchSettingsUseCase {
  constructor(
    @Inject(BRANCH_SETTINGS_REPOSITORY)
    private readonly repo: branchSettingsRepository.BranchSettingsRepository,

    @Inject(CACHE_PORT)
    private readonly cache: CachePort,

    private readonly branchSettingsCache: BranchSettingsCacheService,
    private readonly availabilityCache: AvailabilityCacheService,
  ) {}

  async execute(branchId: string, input: UpdateBranchSettingsInput) {
    // 1️⃣ update
    const result = await this.repo.update(branchId, input);

    // 2️⃣ invalidate explore cache
    await Promise.all([
      this.cache.delPattern('explore:*'),
      this.branchSettingsCache.invalidate(branchId),
      this.cache.delPattern(`calendar:day:${branchId}:*`),
      this.cache.delPattern(`calendar:week:${branchId}:*`),
      this.availabilityCache.invalidate(branchId),
    ]);

    return result;
  }
}
