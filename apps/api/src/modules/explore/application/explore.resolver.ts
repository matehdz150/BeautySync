import { Resolver, Query } from '@nestjs/graphql';
import { ExploreBranchGql } from './dto/explore-branch.dto';
import { GetExploreBranchesUseCase } from '../core/use-cases/get-explore-branches.use-case';

@Resolver(() => ExploreBranchGql)
export class ExploreResolver {
  constructor(private readonly useCase: GetExploreBranchesUseCase) {}

  @Query(() => [ExploreBranchGql])
  async exploreBranches() {
    return this.useCase.execute();
  }
}
