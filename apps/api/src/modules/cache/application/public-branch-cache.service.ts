import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import type { DB } from 'src/modules/db/client';
import { branches } from 'src/modules/db/schema/branches/branches';
import { requestContext } from 'src/modules/metrics/request-context';

import { CACHE_PORT } from '../core/ports/tokens';
import { CachePort } from '../core/ports/cache.port';

export type CachedPublicBranch = {
  id: string;
  organizationId: string;
  publicSlug: string | null;
  publicPresenceEnabled: boolean;
  name: string;
};

@Injectable()
export class PublicBranchCacheService {
  private static readonly TTL_SECONDS = 60;

  constructor(
    @Inject('DB')
    private readonly db: DB,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async getBySlug(slug: string): Promise<CachedPublicBranch> {
    return requestContext.getOrSet(`public_branch:slug:${slug}`, async () => {
      const key = this.buildSlugKey(slug);
      const cached = await this.cache.get<CachedPublicBranch>(key);
      if (cached) {
        return cached;
      }

      const row = await this.db.query.branches.findFirst({
        columns: {
          id: true,
          organizationId: true,
          publicSlug: true,
          publicPresenceEnabled: true,
          name: true,
        },
        where: eq(branches.publicSlug, slug),
      });

      if (!row) {
        throw new NotFoundException('Branch not found');
      }

      await this.cache.set(key, row, PublicBranchCacheService.TTL_SECONDS);
      return row;
    });
  }

  async getCachedBySlug(slug: string): Promise<CachedPublicBranch | null> {
    return requestContext.getOrSet(`public_branch:slug:${slug}:cached_only`, async () => {
      const key = this.buildSlugKey(slug);
      return this.cache.get<CachedPublicBranch>(key);
    });
  }

  async invalidateBySlug(slug: string) {
    await this.cache.del(this.buildSlugKey(slug));
  }

  private buildSlugKey(slug: string) {
    return `branch:public_slug:${slug}`;
  }
}
