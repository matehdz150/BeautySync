import { Resolver, Query, Args } from '@nestjs/graphql';
import { ExploreBranchGql, ExploreSort } from './dto/explore-branch.dto';
import { GetExploreBranchesUseCase } from '../core/use-cases/get-explore-branches.use-case';

@Resolver(() => ExploreBranchGql)
export class ExploreResolver {
  constructor(private readonly useCase: GetExploreBranchesUseCase) {}

  @Query(() => [ExploreBranchGql])
  async exploreBranches(
    @Args('lat', { nullable: true }) lat?: number,
    @Args('lng', { nullable: true }) lng?: number,
    @Args('radius', { nullable: true }) radius?: number,
    @Args('categories', { nullable: true }) categories?: string,
    @Args('minPrice', { nullable: true }) minPrice?: number,
    @Args('maxPrice', { nullable: true }) maxPrice?: number,
    @Args('rating', { nullable: true }) rating?: number,
    @Args('sort', { type: () => ExploreSort, nullable: true })
    sort?: ExploreSort,
  ) {
    const filters = {
      lat,
      lng,
      radius,
      categories,
      minPrice,
      maxPrice,
      rating,
      sort,
    };

    return this.useCase.execute(filters);
  }
}
