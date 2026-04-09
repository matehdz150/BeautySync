import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import type { DB } from 'src/modules/db/client';
import { staff } from 'src/modules/db/schema/staff/staff';
import { requestContext } from 'src/modules/metrics/request-context';

import { CACHE_PORT } from '../core/ports/tokens';
import { CachePort } from '../core/ports/cache.port';

export type CachedBranchStaff = {
  id: string;
  branchId: string;
  userId: string | null;
  name: string;
  avatarUrl: string | null;
  isActive: boolean;
};

@Injectable()
export class BranchStaffCacheService {
  private static readonly TTL_SECONDS = 30;

  constructor(
    @Inject('DB')
    private readonly db: DB,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async getByBranch(branchId: string): Promise<CachedBranchStaff[]> {
    return requestContext.getOrSet(`staff:branch:${branchId}`, async () => {
      const key = this.buildKey(branchId);
      const cached = await this.cache.get<CachedBranchStaff[]>(key);
      if (cached) {
        return cached;
      }

      const rows = await this.db.query.staff.findMany({
        columns: {
          id: true,
          branchId: true,
          userId: true,
          name: true,
          avatarUrl: true,
          isActive: true,
        },
        where: eq(staff.branchId, branchId),
      });

      await this.cache.set(key, rows, BranchStaffCacheService.TTL_SECONDS);
      return rows;
    });
  }

  async getActiveMap(branchId: string): Promise<Map<string, CachedBranchStaff>> {
    const rows = await this.getByBranch(branchId);
    return new Map(rows.filter((row) => row.isActive).map((row) => [row.id, row]));
  }

  async invalidate(branchId: string) {
    await this.cache.del(this.buildKey(branchId));
  }

  private buildKey(branchId: string) {
    return `staff:branch:v2:${branchId}`;
  }
}
