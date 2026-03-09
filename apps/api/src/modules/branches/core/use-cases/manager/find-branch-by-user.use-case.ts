import { Inject, Injectable } from '@nestjs/common';
import { BRANCHES_REPOSITORY } from '../../ports/tokens';
import * as branchesRepository from '../../ports/branches.repository';

@Injectable()
export class FindBranchByUserUseCase {
  constructor(
    @Inject(BRANCHES_REPOSITORY)
    private readonly repo: branchesRepository.BranchesRepository,
  ) {}

  execute(userId: string) {
    return this.repo.findBranchByUser(userId);
  }
}
