import { Inject, Injectable } from '@nestjs/common';
import * as branchesRepository from '../../ports/branches.repository';
import { BRANCHES_REPOSITORY } from '../../ports/tokens';
import { CreateBranchInput } from '../../ports/branches.repository';

@Injectable()
export class CreateBranchUseCase {
  constructor(
    @Inject(BRANCHES_REPOSITORY)
    private readonly repo: branchesRepository.BranchesRepository,
  ) {}

  execute(dto: CreateBranchInput) {
    return this.repo.create(dto);
  }
}
