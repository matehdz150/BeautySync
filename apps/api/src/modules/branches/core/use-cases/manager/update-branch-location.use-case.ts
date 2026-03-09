import { Inject, Injectable } from '@nestjs/common';
import { BRANCHES_REPOSITORY } from '../../ports/tokens';
import * as branchesRepository from '../../ports/branches.repository';

@Injectable()
export class UpdateBranchLocationUseCase {
  constructor(
    @Inject(BRANCHES_REPOSITORY)
    private readonly repo: branchesRepository.BranchesRepository,
  ) {}

  execute(branchId: string, dto: branchesRepository.UpdateBranchLocationInput) {
    return this.repo.updateLocation(branchId, dto);
  }
}
