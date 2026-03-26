import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ExploreRepository } from '../ports/explore.repository';
import { EXPLORE_REPOSITORY } from '../ports/tokens';
import { ExploreFilters } from '../entities/explore-branch.entity';

@Injectable()
export class GetExploreBranchesUseCase {
  constructor(
    @Inject(EXPLORE_REPOSITORY)
    private readonly repo: ExploreRepository,
  ) {}

  async execute(filters: ExploreFilters = {}) {
    // =========================
    // VALIDACIONES LOCATION
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

    // =========================
    // VALIDACIÓN RADIUS
    // =========================
    if (filters.radius !== undefined) {
      if (filters.radius <= 0) {
        throw new BadRequestException('radius debe ser mayor a 0');
      }

      if (filters.radius > 100) {
        throw new BadRequestException('radius demasiado grande');
      }
    }

    // =========================
    // VALIDACIÓN PRICE
    // =========================
    if (
      filters.minPrice !== undefined &&
      filters.maxPrice !== undefined &&
      filters.minPrice > filters.maxPrice
    ) {
      throw new BadRequestException('minPrice no puede ser mayor que maxPrice');
    }

    // =========================
    // VALIDACIÓN RATING
    // =========================
    if (filters.rating !== undefined) {
      if (filters.rating < 0 || filters.rating > 5) {
        throw new BadRequestException('rating inválido (0 - 5)');
      }
    }

    // =========================
    // VALIDACIÓN SORT
    // =========================
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
    // EXECUTE
    // =========================
    return this.repo.findExploreBranches(normalizedFilters);
  }
}
