import {
  ExploreBranch,
  ExploreFilters,
} from '../entities/explore-branch.entity';

export interface ExploreRepository {
  findExploreBranches(filters?: ExploreFilters): Promise<ExploreBranch[]>;
}
