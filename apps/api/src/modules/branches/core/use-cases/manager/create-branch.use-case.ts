import { Inject, Injectable } from '@nestjs/common';
import * as branchesRepository from '../../ports/branches.repository';
import { BRANCHES_REPOSITORY } from '../../ports/tokens';
import { CreateBranchInput } from '../../ports/branches.repository';
import { BranchCacheService } from 'src/modules/cache/application/branch-cache.service';

@Injectable()
export class CreateBranchUseCase {
  constructor(
    @Inject(BRANCHES_REPOSITORY)
    private readonly repo: branchesRepository.BranchesRepository,

    private readonly branchCache: BranchCacheService,
  ) {}

  async execute(dto: CreateBranchInput) {
    const branch = await this.repo.create(dto);
    await this.branchCache.invalidate(branch.organizationId);

    return branch;
  }
}
