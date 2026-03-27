import { Module } from '@nestjs/common';

import { ExploreResolver } from './application/explore.resolver';
import { GetExploreBranchesUseCase } from './core/use-cases/get-explore-branches.use-case';
import { DrizzleExploreRepository } from './infrasructure/adapters/drizzle-explore.repository';

import {
  EXPLORE_REPOSITORY,
  GLOBAL_SEARCH_REPOSITORY,
} from './core/ports/tokens';
import { CacheModule } from '../cache/cache.module';
import { DrizzleGlobalSearchRepository } from './infrasructure/adapters/drizzle-global-search.repository';
import { GlobalSearchUseCase } from './core/use-cases/global-search.use-case';
import { GlobalSearchController } from './application/controllers/global-search.controller';

@Module({
  imports: [CacheModule],
  controllers: [GlobalSearchController],
  providers: [
    ExploreResolver,
    GetExploreBranchesUseCase,
    GlobalSearchUseCase,
    {
      provide: EXPLORE_REPOSITORY,
      useClass: DrizzleExploreRepository,
    },
    {
      provide: GLOBAL_SEARCH_REPOSITORY,
      useClass: DrizzleGlobalSearchRepository,
    },
  ],
})
export class ExploreModule {}
