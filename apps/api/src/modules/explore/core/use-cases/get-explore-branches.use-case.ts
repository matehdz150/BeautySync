import { Inject, Injectable } from '@nestjs/common';
import { ExploreRepository } from '../ports/explore.repository';
import { EXPLORE_REPOSITORY } from '../ports/tokens';

@Injectable()
export class GetExploreBranchesUseCase {
  constructor(
    @Inject(EXPLORE_REPOSITORY)
    private repo: ExploreRepository,
  ) {}

  execute() {
    return this.repo.findExploreBranches();
  }
}
