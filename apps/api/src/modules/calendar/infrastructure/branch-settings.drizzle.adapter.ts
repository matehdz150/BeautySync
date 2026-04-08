import { Injectable } from '@nestjs/common';
import { BranchSettingsCacheService } from 'src/modules/cache/application/branch-settings-cache.service';

import { BranchSettingsPort } from '../core/ports/branch-settings.port';

@Injectable()
export class BranchSettingsDrizzleAdapter implements BranchSettingsPort {
  constructor(private readonly branchSettingsCache: BranchSettingsCacheService) {}

  async getTimezone(branchId: string): Promise<string> {
    return this.branchSettingsCache.getTimezone(branchId);
  }
}
