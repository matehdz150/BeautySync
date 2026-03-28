import { Inject, Injectable } from '@nestjs/common';
import { FAVORITES_REPOSITORY } from '../ports/tokens';
import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';

import * as repo from '../ports/favorites.repository';
import * as cachePort from 'src/modules/cache/core/ports/cache.port';
import { FavoriteBranch } from '../entities/favorite.entity';

@Injectable()
export class GetUserFavoritesUseCase {
  constructor(
    @Inject(FAVORITES_REPOSITORY)
    private readonly repository: repo.FavoritesRepository,

    @Inject(CACHE_PORT)
    private readonly cache: cachePort.CachePort,
  ) {}

  async execute(userId: string) {
    const cacheKey = `favorites:user:${userId}`;

    // 🔥 CACHE HIT
    const cached = await this.cache.get<FavoriteBranch[]>(cacheKey);
    if (cached) return cached;

    // 🔥 DB
    const favorites = await this.repository.getUserFavorites(userId);

    // 🔥 CACHE SET
    await this.cache.set(cacheKey, favorites, 60);

    return favorites;
  }
}
