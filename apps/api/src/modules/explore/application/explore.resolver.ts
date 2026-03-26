import { Resolver, Query, Args } from '@nestjs/graphql';
import { ExploreBranchGql } from './dto/explore-branch.dto';
import { GetExploreBranchesUseCase } from '../core/use-cases/get-explore-branches.use-case';
import { ExploreFiltersInput } from './dto/explore-branch.dto';

@Resolver(() => ExploreBranchGql)
export class ExploreResolver {
  constructor(private readonly useCase: GetExploreBranchesUseCase) {}

  @Query(() => [ExploreBranchGql])
  async exploreBranches(
    @Args('filters', { type: () => ExploreFiltersInput, nullable: true })
    filters?: ExploreFiltersInput,
  ) {
    return this.useCase.execute(filters ?? {});
  }
}
