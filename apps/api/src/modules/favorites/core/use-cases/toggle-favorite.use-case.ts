import { Inject, Injectable } from '@nestjs/common';
import { FAVORITES_REPOSITORY } from '../ports/tokens';
import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import { CachePort } from 'src/modules/cache/core/ports/cache.port';
import { FavoritesRepository } from '../ports/favorites.repository';

@Injectable()
export class ToggleFavoriteUseCase {
  constructor(
    @Inject(FAVORITES_REPOSITORY)
    private readonly repository: FavoritesRepository,

    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(userId: string, branchId: string) {
    const exists = await this.repository.isFavorite(userId, branchId);

    if (exists) {
      await this.repository.removeFavorite(userId, branchId);
    } else {
      await this.repository.addFavorite(userId, branchId);
    }

    // 🔥 INVALIDAR CACHE
    await this.cache.del(`favorites:user:${userId}`);
    await this.cache.delPattern(`search:global:*`);

    return { isFavorite: !exists };
  }
}
