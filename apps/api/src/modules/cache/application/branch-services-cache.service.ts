import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import type { DB } from 'src/modules/db/client';
import { services } from 'src/modules/db/schema/services/service';
import { requestContext } from 'src/modules/metrics/request-context';

import { CACHE_PORT } from '../core/ports/tokens';
import { CachePort } from '../core/ports/cache.port';

export type CachedBranchService = {
  id: string;
  branchId: string;
  name: string;
  durationMin: number;
  priceCents: number | null;
  isActive: boolean;
  categoryId: string | null;
};

@Injectable()
export class BranchServicesCacheService {
  private static readonly TTL_SECONDS = 45;

  constructor(
    @Inject('DB')
    private readonly db: DB,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async getActive(branchId: string): Promise<CachedBranchService[]> {
    return requestContext.getOrSet(`services:branch:${branchId}`, async () => {
      const key = this.buildKey(branchId);
      const cached = await this.cache.get<CachedBranchService[]>(key);
      if (cached) {
        return cached;
      }

      const rows = await this.db.query.services.findMany({
        columns: {
          id: true,
          branchId: true,
          name: true,
          durationMin: true,
          priceCents: true,
          isActive: true,
          categoryId: true,
        },
        where: eq(services.branchId, branchId),
      });

      await this.cache.set(key, rows, BranchServicesCacheService.TTL_SECONDS);
      return rows;
    });
  }

  async getActiveMap(branchId: string): Promise<Map<string, CachedBranchService>> {
    const rows = await this.getActive(branchId);
    return new Map(rows.filter((row) => row.isActive).map((row) => [row.id, row]));
  }

  async invalidate(branchId: string) {
    await this.cache.del(this.buildKey(branchId));
  }

  private buildKey(branchId: string) {
    return `services:${branchId}`;
  }
}
