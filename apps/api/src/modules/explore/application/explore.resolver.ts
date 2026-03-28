import { Resolver, Query, Args } from '@nestjs/graphql';
import { ExploreBranchGql, ExploreSort } from './dto/explore-branch.dto';
import { GetExploreBranchesUseCase } from '../core/use-cases/get-explore-branches.use-case';

import { GqlPublicAuthGuard } from 'src/modules/auth/application/guards/gql-publicAuth.guard';
import { GqlPublicUser } from 'src/modules/auth/application/decorators/gql-publicUser.decorator';
import { UseGuards } from '@nestjs/common';

@Resolver(() => ExploreBranchGql)
@UseGuards(GqlPublicAuthGuard) // 🔥 clave
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

    @GqlPublicUser() userId?: string, // 🔥 limpio
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

    return this.useCase.execute(filters, userId);
  }
}
