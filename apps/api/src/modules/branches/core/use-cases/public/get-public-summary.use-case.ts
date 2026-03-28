import { Inject, Injectable } from '@nestjs/common';
import { PUBLIC_BRANCHES_REPOSITORY } from '../../ports/tokens';
import { PublicBranchesRepository } from '../../ports/public-branches.repository';

import { FAVORITES_REPOSITORY } from 'src/modules/favorites/core/ports/tokens';
import { FavoritesRepository } from 'src/modules/favorites/core/ports/favorites.repository';

import { PublicBranchSummary } from '../../entities/public-branch.entity';

type Result = PublicBranchSummary & {
  isFavorite: boolean;
};
@Injectable()
export class GetPublicBranchSummaryUseCase {
  constructor(
    @Inject(PUBLIC_BRANCHES_REPOSITORY)
    private readonly repo: PublicBranchesRepository,

    @Inject(FAVORITES_REPOSITORY)
    private readonly favoritesRepo: FavoritesRepository,
  ) {}

  async execute(branchId: string, userId?: string): Promise<Result> {
    const branch = await this.repo.getSummaryById(branchId);

    if (!userId) {
      return {
        ...branch,
        isFavorite: false,
      };
    }

    const isFavorite = await this.favoritesRepo.isFavorite(userId, branchId);

    return {
      ...branch,
      isFavorite,
    };
  }
}
