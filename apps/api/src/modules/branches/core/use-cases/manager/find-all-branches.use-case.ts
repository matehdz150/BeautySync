import { Inject, Injectable } from '@nestjs/common';
import * as branchesRepository from '../../ports/branches.repository';
import { BRANCHES_REPOSITORY } from '../../ports/tokens';

@Injectable()
export class FindAllBranchesUseCase {
  constructor(
    @Inject(BRANCHES_REPOSITORY)
    private readonly repo: branchesRepository.BranchesRepository,
  ) {}

  execute() {
    return this.repo.findAll();
  }
}
