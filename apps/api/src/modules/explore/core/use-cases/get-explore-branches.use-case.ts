import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ExploreRepository } from '../ports/explore.repository';
import { EXPLORE_REPOSITORY } from '../ports/tokens';
import { ExploreFilters } from '../entities/explore-branch.entity';

import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import { CachePort } from 'src/modules/cache/core/ports/cache.port';

import { FAVORITES_REPOSITORY } from 'src/modules/favorites/core/ports/tokens';
import { FavoritesRepository } from 'src/modules/favorites/core/ports/favorites.repository';

type ExploreBranchResult = Awaited<
  ReturnType<ExploreRepository['findExploreBranches']>
>;

// 👇 extendemos el resultado con favoritos
type ExploreBranchWithFavorite = ExploreBranchResult[number] & {
  isFavorite?: boolean;
};

@Injectable()
export class GetExploreBranchesUseCase {
  constructor(
    @Inject(EXPLORE_REPOSITORY)
    private readonly repo: ExploreRepository,

    @Inject(CACHE_PORT)
    private readonly cache: CachePort,

    @Inject(FAVORITES_REPOSITORY)
    private readonly favoritesRepo: FavoritesRepository,
  ) {}

  async execute(
    filters: ExploreFilters = {},
    userId?: string,
  ): Promise<ExploreBranchWithFavorite[]> {
    // =========================
    // VALIDACIONES
    // =========================
    const hasLat = typeof filters.lat === 'number';
    const hasLng = typeof filters.lng === 'number';

    if (hasLat !== hasLng) {
      throw new BadRequestException('lat y lng deben venir juntos');
    }

    if (hasLat && (filters.lat! < -90 || filters.lat! > 90)) {
      throw new BadRequestException('lat inválida');
    }

    if (hasLng && (filters.lng! < -180 || filters.lng! > 180)) {
      throw new BadRequestException('lng inválida');
    }

    if (filters.radius !== undefined) {
      if (filters.radius <= 0) {
        throw new BadRequestException('radius debe ser mayor a 0');
      }

      if (filters.radius > 100) {
        throw new BadRequestException('radius demasiado grande');
      }
    }

    if (
      filters.minPrice !== undefined &&
      filters.maxPrice !== undefined &&
      filters.minPrice > filters.maxPrice
    ) {
      throw new BadRequestException('minPrice no puede ser mayor que maxPrice');
    }

    if (filters.rating !== undefined) {
      if (filters.rating < 0 || filters.rating > 5) {
        throw new BadRequestException('rating inválido (0 - 5)');
      }
    }

    const allowedSorts = ['distance', 'rating', 'price'];

    if (filters.sort && !allowedSorts.includes(filters.sort)) {
      throw new BadRequestException('sort inválido');
    }

    // =========================
    // NORMALIZACIÓN
    // =========================
    const normalizedFilters: ExploreFilters = {
      ...filters,
      categories: filters.categories
        ? filters.categories.toLowerCase()
        : undefined,
    };

    // =========================
    // 🔥 CACHE KEY (NO userId)
    // =========================
    const key = this.buildCacheKey(normalizedFilters);

    let baseResult: ExploreBranchResult;

    const cached = await this.cache.get<ExploreBranchResult>(key);

    if (cached) {
      baseResult = cached;
    } else {
      baseResult = await this.repo.findExploreBranches(normalizedFilters);

      await this.cache.set(key, baseResult, 60);
    }

    // =========================
    // 🔥 SIN USUARIO → sin favoritos
    // =========================
    if (!userId) {
      return baseResult;
    }

    // =========================
    // 🔥 FAVORITES MERGE
    // =========================
    const favoriteIds = await this.favoritesRepo.getUserFavoriteIds(userId);

    const favoriteSet = new Set(favoriteIds);

    return baseResult.map((b) => ({
      ...b,
      isFavorite: favoriteSet.has(b.id),
    }));
  }

  // =========================
  // 🔥 KEY BUILDER
  // =========================
  private buildCacheKey(filters: ExploreFilters): string {
    const sorted = (Object.keys(filters) as (keyof ExploreFilters)[])
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        const value = filters[key];

        if (value === undefined || value === null) return acc;

        acc[key] = value;
        return acc;
      }, {});

    return `explore:${JSON.stringify(sorted)}`;
  }
}
