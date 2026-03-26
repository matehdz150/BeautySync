import { Module } from '@nestjs/common';

import { ExploreResolver } from './application/explore.resolver';
import { GetExploreBranchesUseCase } from './core/use-cases/get-explore-branches.use-case';
import { DrizzleExploreRepository } from './infrasructure/adapters/drizzle-explore.repository';

import { EXPLORE_REPOSITORY } from './core/ports/tokens';

@Module({
  providers: [
    ExploreResolver,
    GetExploreBranchesUseCase,
    {
      provide: EXPLORE_REPOSITORY,
      useClass: DrizzleExploreRepository,
    },
  ],
})
export class ExploreModule {}
