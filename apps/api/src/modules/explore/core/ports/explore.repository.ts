import { ExploreBranch } from '../entities/explore-branch.entity';

export interface ExploreRepository {
  findExploreBranches(): Promise<ExploreBranch[]>;
}
