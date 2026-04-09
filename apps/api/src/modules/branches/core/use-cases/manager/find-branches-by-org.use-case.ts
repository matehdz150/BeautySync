import { Inject, Injectable } from '@nestjs/common';
import { BranchCacheService } from 'src/modules/cache/application/branch-cache.service';

@Injectable()
export class FindBranchesByOrgUseCase {
  constructor(private readonly branchCache: BranchCacheService) {}

  execute(orgId: string) {
    return this.branchCache.getBranches(orgId);
  }
}
