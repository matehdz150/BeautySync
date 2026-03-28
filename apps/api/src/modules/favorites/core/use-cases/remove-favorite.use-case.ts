import { Inject, Injectable } from '@nestjs/common';
import { FAVORITES_REPOSITORY } from '../ports/tokens';
import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import { FavoritesRepository } from '../ports/favorites.repository';
import { CachePort } from 'src/modules/cache/core/ports/cache.port';

@Injectable()
export class RemoveFavoriteUseCase {
  constructor(
    @Inject(FAVORITES_REPOSITORY)
    private readonly repository: FavoritesRepository,

    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(userId: string, branchId: string) {
    await this.repository.removeFavorite(userId, branchId);

    await this.cache.del(`favorites:user:${userId}`);

    return { success: true };
  }
}
