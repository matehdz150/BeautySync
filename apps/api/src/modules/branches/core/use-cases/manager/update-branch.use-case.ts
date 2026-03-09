import { Inject, Injectable } from '@nestjs/common';
import { BRANCHES_REPOSITORY } from '../../ports/tokens';
import * as branchesRepository from '../../ports/branches.repository';

@Injectable()
export class UpdateBranchUseCase {
  constructor(
    @Inject(BRANCHES_REPOSITORY)
    private readonly repo: branchesRepository.BranchesRepository,
  ) {}

  execute(branchId: string, dto: branchesRepository.UpdateBranchInput) {
    return this.repo.updateBranch(branchId, dto);
  }
}
