import { Inject, Injectable } from '@nestjs/common';
import { GLOBAL_SEARCH_REPOSITORY } from '../ports/tokens';
import * as repo from '../ports/global-search.repository';

import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import * as cachePort from 'src/modules/cache/core/ports/cache.port';

import { GlobalSearchResult } from '../ports/global-search.repository';

import {
  BranchSearchItem,
  ServiceSearchItem,
  StaffSearchItem,
} from '../entities/global-search.entity'; // 🔥 IMPORT CORRECTO

@Injectable()
export class GlobalSearchUseCase {
  constructor(
    @Inject(GLOBAL_SEARCH_REPOSITORY)
    private readonly repository: repo.GlobalSearchRepository,

    @Inject(CACHE_PORT)
    private readonly cache: cachePort.CachePort,
  ) {}

  async execute(params: {
    query?: string;
    lat?: number;
    lng?: number;
    type?: 'all' | 'branches' | 'services' | 'staff';
  }): Promise<GlobalSearchResult> {
    const query = this.normalizeQuery(params.query);
    const type = params.type ?? 'all';

    const cacheKey = this.buildCacheKey(query, params.lat, params.lng, type);

    const cached = await this.cache.get<GlobalSearchResult>(cacheKey);
    if (cached) return cached;

    let branches: BranchSearchItem[] = [];
    let services: ServiceSearchItem[] = [];
    let staff: StaffSearchItem[] = [];

    // =========================
    // 🔥 RECOMMENDATIONS
    // =========================
    if (!query && type === 'all') {
      const [b, s, st] = await Promise.all([
        this.repository.getRecommendedBranches({
          limit: 3,
          lat: params.lat,
          lng: params.lng,
        }),
        this.repository.getRecommendedServices(4),
        this.repository.getRecommendedStaff(2),
      ]);

      branches = b;
      services = s;
      staff = st;
    }

    // =========================
    // 🔥 EXPLORE (sin query)
    // =========================
    else if (!query) {
      if (type === 'branches') {
        branches = await this.repository.searchBranches({
          query: '',
          limit: 20,
          lat: params.lat,
          lng: params.lng,
        });
      }

      if (type === 'services') {
        services = await this.repository.searchServices('', 20);
      }

      if (type === 'staff') {
        staff = await this.repository.searchStaff('', 20);
      }
    }

    // =========================
    // 🔥 SEARCH (con query)
    // =========================
    else {
      if (query.length < 2) {
        return { branches: [], services: [], staff: [] };
      }

      const branchesPromise: Promise<BranchSearchItem[]> =
        type === 'all' || type === 'branches'
          ? this.repository.searchBranches({
              query,
              limit: 5,
              lat: params.lat,
              lng: params.lng,
            })
          : Promise.resolve([]);

      const servicesPromise: Promise<ServiceSearchItem[]> =
        type === 'all' || type === 'services'
          ? this.repository.searchServices(query, 5)
          : Promise.resolve([]);

      const staffPromise: Promise<StaffSearchItem[]> =
        type === 'all' || type === 'staff'
          ? this.repository.searchStaff(query, 5)
          : Promise.resolve([]);

      const [b, s, st] = await Promise.all([
        branchesPromise,
        servicesPromise,
        staffPromise,
      ]);

      branches = b;
      services = s;
      staff = st;
    }

    const result: GlobalSearchResult = { branches, services, staff };

    await this.cache.set(cacheKey, result, 60);

    return result;
  }

  // =========================
  // 🔧 HELPERS
  // =========================

  private normalizeQuery(query?: string): string | null {
    if (!query) return null;

    const normalized = query
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');

    return normalized.length ? normalized : null;
  }

  private buildCacheKey(
    query: string | null,
    lat?: number,
    lng?: number,
    type?: string,
  ) {
    return `search:global:${type ?? 'all'}:${query ?? 'empty'}:${lat ?? 0}:${lng ?? 0}`;
  }
}
