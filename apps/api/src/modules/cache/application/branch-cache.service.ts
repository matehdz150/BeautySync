import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import type { DB } from 'src/modules/db/client';
import { Branch } from 'src/modules/branches/core/entities/branch.entity';
import { branches } from 'src/modules/db/schema/branches/branches';
import { requestContext } from 'src/modules/metrics/request-context';

import { RedisService } from './redis.service';

type MemoryEntry<T> = {
  data: T;
  expiresAt: number;
};

type BranchListRow = {
  id: string;
  organizationId: string;
  name: string;
  address: string | null;
  publicSlug: string | null;
  lat: string | null;
  lng: string | null;
};

@Injectable()
export class BranchCacheService {
  private static readonly REDIS_TTL_SECONDS = 600;
  private static readonly L1_TTL_MS = 10_000;

  private readonly memory = new Map<string, MemoryEntry<unknown>>();

  constructor(
    @Inject('DB')
    private readonly db: DB,

    private readonly redis: RedisService,
  ) {}

  async getBranchIds(orgId: string): Promise<string[]> {
    return requestContext.getOrSet(`branch_cache:ids:${orgId}`, async () => {
      const key = this.buildBranchIdsKey(orgId);
      const fromMemory = this.getMemory<string[]>(key);
      if (fromMemory) return fromMemory;

      const fromRedis = await this.redis.get<string[]>(key);
      if (fromRedis) {
        this.setMemory(key, fromRedis);
        return fromRedis;
      }

      const rows = await this.db.query.branches.findMany({
        columns: {
          id: true,
        },
        where: eq(branches.organizationId, orgId),
      });

      const ids = rows.map((row) => row.id);
      await this.redis.set(key, ids, BranchCacheService.REDIS_TTL_SECONDS);
      this.setMemory(key, ids);

      return ids;
    });
  }

  async getBranches(orgId: string): Promise<Branch[]> {
    return requestContext.getOrSet(
      `branch_cache:list:${orgId}`,
      async () => {
        const key = this.buildBranchesKey(orgId);
        const fromMemory = this.getMemory<Branch[]>(key);
        if (fromMemory) return fromMemory;

        const fromRedis = await this.redis.get<BranchListRow[]>(key);
        if (fromRedis) {
          const mapped = fromRedis.map((row) => this.toBranch(row));
          this.setMemory(key, mapped);
          return mapped;
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

        await this.redis.set(key, rows, BranchCacheService.REDIS_TTL_SECONDS);

        const mapped = rows.map((row) => this.toBranch(row));
        this.setMemory(key, mapped);

        return mapped;
      },
    );
  }

  async invalidate(orgId: string): Promise<void> {
    const idsKey = this.buildBranchIdsKey(orgId);
    const branchesKey = this.buildBranchesKey(orgId);

    this.memory.delete(idsKey);
    this.memory.delete(branchesKey);

    await Promise.all([this.redis.del(idsKey), this.redis.del(branchesKey)]);
  }

  private toBranch(row: BranchListRow): Branch {
    return new Branch(
      row.id,
      row.organizationId,
      row.name,
      row.address,
      null,
      row.lat,
      row.lng,
      false,
      false,
      row.publicSlug,
    );
  }

  private buildBranchIdsKey(orgId: string) {
    return `org_branch_ids:${orgId}`;
  }

  private buildBranchesKey(orgId: string) {
    return `org_branches:${orgId}`;
  }

  private getMemory<T>(key: string): T | null {
    const entry = this.memory.get(key) as MemoryEntry<T> | undefined;
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.memory.delete(key);
      return null;
    }

    return entry.data;
  }

  private setMemory<T>(key: string, data: T): void {
    this.memory.set(key, {
      data,
      expiresAt: Date.now() + BranchCacheService.L1_TTL_MS,
    });
  }
}
