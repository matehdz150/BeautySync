import { Inject, Injectable } from '@nestjs/common';

import { CACHE_PORT } from '../cache/core/ports/tokens';
import { CachePort } from '../cache/core/ports/cache.port';

type NotificationListResponse = {
  items: Array<{
    id: string;
    bookingId: string | null;
    branchId: string;
    kind: string;
    payload: Record<string, unknown>;
    readAt: Date | null;
    createdAt: Date;
  }>;
  nextCursor: string | null;
};

@Injectable()
export class NotificationsManagerCacheService {
  private static readonly TTL_SECONDS = 15;

  constructor(
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async get(params: {
    branchIds: string[];
    unread?: boolean;
    limit: number;
    kind?: 'ALL' | 'BOOKING' | 'CHAT';
    cursor?: string;
  }): Promise<NotificationListResponse | null> {
    if (params.cursor) {
      return null;
    }

    return this.cache.get<NotificationListResponse>(this.buildKey(params));
  }

  async set(
    params: {
      branchIds: string[];
      unread?: boolean;
      limit: number;
      kind?: 'ALL' | 'BOOKING' | 'CHAT';
      cursor?: string;
    },
    value: NotificationListResponse,
  ) {
    if (params.cursor) {
      return;
    }

    await this.cache.set(
      this.buildKey(params),
      value,
      NotificationsManagerCacheService.TTL_SECONDS,
    );
  }

  async invalidateBranch(branchId: string) {
    await this.cache.delPattern(`notifications:manager:*:branch:${branchId}:*`);
  }

  async invalidateBranches(branchIds: string[]) {
    await Promise.all(
      [...new Set(branchIds)].map((branchId) => this.invalidateBranch(branchId)),
    );
  }

  private buildKey(params: {
    branchIds: string[];
    unread?: boolean;
    limit: number;
    kind?: 'ALL' | 'BOOKING' | 'CHAT';
  }) {
    const sortedBranchIds = [...params.branchIds].sort();
    return [
      'notifications:manager',
      `branches:${sortedBranchIds.join(',')}`,
      ...sortedBranchIds.map((branchId) => `branch:${branchId}`),
      `unread:${params.unread === true ? '1' : '0'}`,
      `kind:${params.kind ?? 'ALL'}`,
      `limit:${params.limit}`,
    ].join(':');
  }
}
