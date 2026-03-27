import { Inject, Injectable } from '@nestjs/common';
import { GLOBAL_SEARCH_REPOSITORY } from '../ports/tokens';
import * as repo from '../ports/global-search.repository';

import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import * as cachePort from 'src/modules/cache/core/ports/cache.port';

import { GlobalSearchResult } from '../ports/global-search.repository';

/* ========================= */
/* CURSOR */
/* ========================= */

type Cursor = {
  score: number;
  id: string;
};

function isCursor(value: unknown): value is Cursor {
  if (typeof value !== 'object' || value === null) return false;

  const v = value as Record<string, unknown>;

  return typeof v.score === 'number' && typeof v.id === 'string';
}

function parseCursor(cursor?: string): Cursor | undefined {
  if (!cursor) return undefined;

  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(cursor, 'base64').toString(),
    );

    if (isCursor(parsed)) return parsed;

    return undefined;
  } catch {
    return undefined;
  }
}

/* ========================= */
/* USE CASE */
/* ========================= */

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
    cursor?: string;
    limit?: number;
  }): Promise<GlobalSearchResult> {
    const query = this.normalizeQuery(params.query);
    const type = params.type ?? 'all';
    const limit = params.limit ?? 10;

    // 🔥 cursor SOLO permitido si NO es "all"
    const isCursorAllowed = type !== 'all';
    const decodedCursor = isCursorAllowed
      ? parseCursor(params.cursor)
      : undefined;

    // 🔥 cache SOLO primera página y NO en "all"
    const shouldCache = !params.cursor && type !== 'all';

    const cacheKey = this.buildCacheKey(query, params.lat, params.lng, type);

    if (shouldCache) {
      const cached = await this.cache.get<GlobalSearchResult>(cacheKey);
      if (cached) return cached;
    }

    // 🔥 resultado SIEMPRE consistente
    let result: GlobalSearchResult = {
      branches: { items: [], nextCursor: null },
      services: { items: [], nextCursor: null },
      staff: { items: [], nextCursor: null },
    };

    /* ========================= */
    /* RECOMMENDATIONS */
    /* ========================= */

    if (!query && type === 'all' && !params.cursor) {
      const [b, s, st] = await Promise.all([
        this.repository.getRecommendedBranches({
          limit: 3,
          lat: params.lat,
          lng: params.lng,
        }),
        this.repository.getRecommendedServices(4),
        this.repository.getRecommendedStaff(2),
      ]);

      result = {
        branches: { items: b, nextCursor: null },
        services: { items: s, nextCursor: null },
        staff: { items: st, nextCursor: null },
      };
    } else if (!query) {
      /* ========================= */
      /* EXPLORE (sin query) */
      /* ========================= */
      if (type === 'branches') {
        result.branches = await this.repository.searchBranches({
          query: '',
          limit,
          cursor: decodedCursor,
          lat: params.lat,
          lng: params.lng,
        });
      }

      if (type === 'services') {
        result.services = await this.repository.searchServices({
          query: '',
          limit,
          cursor: decodedCursor,
        });
      }

      if (type === 'staff') {
        result.staff = await this.repository.searchStaff({
          query: '',
          limit,
          cursor: decodedCursor,
        });
      }
    } else {
      /* ========================= */
      /* SEARCH (con query) */
      /* ========================= */
      if (query.length < 2) {
        return result;
      }

      // 🔥 TYPE ESPECÍFICO → PAGINADO
      if (type === 'branches') {
        result.branches = await this.repository.searchBranches({
          query,
          limit,
          cursor: decodedCursor,
          lat: params.lat,
          lng: params.lng,
        });
      }

      if (type === 'services') {
        result.services = await this.repository.searchServices({
          query,
          limit,
          cursor: decodedCursor,
        });
      }

      if (type === 'staff') {
        result.staff = await this.repository.searchStaff({
          query,
          limit,
          cursor: decodedCursor,
        });
      }

      // 🔥 ALL → SOLO PREVIEW (NO cursor)
      if (type === 'all') {
        const [b, s, st] = await Promise.all([
          this.repository.searchBranches({
            query,
            limit: 5,
            lat: params.lat,
            lng: params.lng,
          }),
          this.repository.searchServices({
            query,
            limit: 5,
          }),
          this.repository.searchStaff({
            query,
            limit: 5,
          }),
        ]);

        result.branches = b;
        result.services = s;
        result.staff = st;
      }
    }

    if (shouldCache) {
      await this.cache.set(cacheKey, result, 60);
    }

    return result;
  }

  /* ========================= */
  /* HELPERS */
  /* ========================= */

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
