import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import type { DB } from 'src/modules/db/client';
import { branches } from 'src/modules/db/schema/branches/branches';
import { requestContext } from 'src/modules/metrics/request-context';

import { CACHE_PORT } from '../core/ports/tokens';
import { CachePort } from '../core/ports/cache.port';

export type CachedOrgBranch = {
  id: string;
  organizationId: string;
  name: string;
  address: string | null;
  publicSlug: string | null;
  lat: string | null;
  lng: string | null;
};

@Injectable()
export class OrgBranchesCacheService {
  private static readonly TTL_SECONDS = 600;

  constructor(
    @Inject('DB')
    private readonly db: DB,

    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async getBranchIds(orgId: string): Promise<string[]> {
    return requestContext.getOrSet(`org_branch_ids:${orgId}`, async () => {
      const cacheKey = this.buildBranchIdsKey(orgId);
      const cached = await this.cache.get<string[]>(cacheKey);

      if (cached) {
        return cached;
      }

      const rows = await this.db.query.branches.findMany({
        columns: {
          id: true,
        },
        where: eq(branches.organizationId, orgId),
      });

      const ids = rows.map((row) => row.id);
      await this.cache.set(cacheKey, ids, OrgBranchesCacheService.TTL_SECONDS);

      return ids;
    });
  }

  async getBranches(orgId: string): Promise<CachedOrgBranch[]> {
    return requestContext.getOrSet(`org_branches:${orgId}`, async () => {
      const cacheKey = this.buildBranchesKey(orgId);
      const cached = await this.cache.get<CachedOrgBranch[]>(cacheKey);

      if (cached) {
        return cached;
      }

      const rows = await this.db.query.branches.findMany({
        columns: {
          id: true,
          organizationId: true,
          name: true,
          address: true,
          publicSlug: true,
          lat: true,
          lng: true,
        },
        where: eq(branches.organizationId, orgId),
      });

      await this.cache.set(cacheKey, rows, OrgBranchesCacheService.TTL_SECONDS);

      return rows;
    });
  }

  async invalidate(orgId: string): Promise<void> {
    await Promise.all([
      this.cache.del(this.buildBranchIdsKey(orgId)),
      this.cache.del(this.buildBranchesKey(orgId)),
    ]);
  }

  private buildBranchIdsKey(orgId: string) {
    return `org_branch_ids:${orgId}`;
  }

  private buildBranchesKey(orgId: string) {
    return `org_branches:${orgId}`;
  }
}
