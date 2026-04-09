import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { REDIS_CACHE } from '../cache/core/ports/tokens';
import { NotificationsRepository } from './notifications.repository';
import {
  buildNotificationItemKey,
  buildNotificationsBranchLatestKey,
  buildNotificationsBranchWarmKey,
  ManagerNotificationCacheItem,
  markManagerBranchLatestAsRead,
  NOTIFICATIONS_BRANCH_LATEST_MAX_ITEMS,
  prependManagerBranchLatest,
  setManagerBranchLatest,
} from './notifications-cache.shared';

type FeedOptions = {
  branchIds: string[];
  unread?: boolean;
  limit: number;
  cursor?: string;
  kind?: 'ALL' | 'BOOKING' | 'CHAT';
};

type FeedResponse = {
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
export class NotificationsCacheService {
  constructor(
    @Inject(REDIS_CACHE)
    private readonly redis: Redis,
    private readonly repo: NotificationsRepository,
  ) {}

  async getManagerFeed(options: FeedOptions): Promise<FeedResponse | null> {
    if (!options.branchIds.length) {
      return { items: [], nextCursor: null };
    }

    if (options.cursor) {
      return null;
    }

    const branchItems = await this.loadBranchItems(options.branchIds);
    const missingBranchIds = branchItems
      .filter((item) => !item.warmed)
      .map((item) => item.branchId);

    if (missingBranchIds.length) {
      await Promise.all(
        missingBranchIds.map((branchId) => this.warmBranch(branchId)),
      );
      return this.getManagerFeed({
        ...options,
        cursor: undefined,
      });
    }

    const filtered = branchItems
      .flatMap((item) => item.items)
      .filter((item) => this.matchesFilters(item, options))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const hasNextPage = filtered.length > options.limit;
    const items = filtered
      .slice(0, options.limit)
      .map((item) => this.toResponseItem(item));

    return {
      items,
      nextCursor: hasNextPage ? items[items.length - 1].createdAt.toISOString() : null,
    };
  }

  async warmBranch(branchId: string) {
    const latest = await this.repo.findManagerLatestByBranch(
      branchId,
      NOTIFICATIONS_BRANCH_LATEST_MAX_ITEMS,
    );
    await setManagerBranchLatest(this.redis, branchId, latest);
  }

  async appendManagerNotification(notification: ManagerNotificationCacheItem) {
    await prependManagerBranchLatest(this.redis, notification);
  }

  async getNotificationById(notificationId: string) {
    const raw = await this.redis.get(buildNotificationItemKey(notificationId));
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as ManagerNotificationCacheItem;
  }

  async setNotification(notification: ManagerNotificationCacheItem) {
    await this.redis.set(
      buildNotificationItemKey(notification.id),
      JSON.stringify(notification),
      'EX',
      60 * 60 * 24,
    );
  }

  async markAsRead(params: {
    branchId: string;
    notificationId: string;
    readAt: string;
  }) {
    await markManagerBranchLatestAsRead(this.redis, params);
  }

  async invalidateBranch(branchId: string) {
    const listKey = buildNotificationsBranchLatestKey(branchId);
    const itemPayloads = await this.redis.lrange(
      listKey,
      0,
      NOTIFICATIONS_BRANCH_LATEST_MAX_ITEMS - 1,
    );
    const itemKeys = itemPayloads.map((rawItem) => {
      const parsed = JSON.parse(rawItem) as ManagerNotificationCacheItem;
      return buildNotificationItemKey(parsed.id);
    });

    await this.redis.del(
      buildNotificationsBranchLatestKey(branchId),
      buildNotificationsBranchWarmKey(branchId),
      ...itemKeys,
    );
  }

  async invalidateBranches(branchIds: string[]) {
    await Promise.all(
      [...new Set(branchIds)].map((branchId) => this.invalidateBranch(branchId)),
    );
  }

  private async loadBranchItems(branchIds: string[]) {
    const pipeline = this.redis.pipeline();

    for (const branchId of branchIds) {
      pipeline.exists(buildNotificationsBranchWarmKey(branchId));
      pipeline.lrange(
        buildNotificationsBranchLatestKey(branchId),
        0,
        NOTIFICATIONS_BRANCH_LATEST_MAX_ITEMS - 1,
      );
    }

    const responses = await pipeline.exec();
    const results: Array<{
      branchId: string;
      warmed: boolean;
      items: ManagerNotificationCacheItem[];
    }> = [];

    for (let index = 0; index < branchIds.length; index += 1) {
      const warmedResponse = responses?.[index * 2]?.[1];
      const listResponse = responses?.[index * 2 + 1]?.[1];
      const rawItems = Array.isArray(listResponse) ? listResponse : [];

      results.push({
        branchId: branchIds[index],
        warmed: Number(warmedResponse ?? 0) > 0,
        items: rawItems.map((rawItem) =>
          JSON.parse(String(rawItem)) as ManagerNotificationCacheItem,
        ),
      });
    }

    return results;
  }

  private matchesFilters(
    item: ManagerNotificationCacheItem,
    options: Omit<FeedOptions, 'branchIds' | 'limit'>,
  ) {
    if (options.unread === true && item.readAt) {
      return false;
    }

    if (!options.kind || options.kind === 'ALL') {
      return true;
    }

    if (options.kind === 'CHAT') {
      return item.kind === 'CHAT_MESSAGE';
    }

    return (
      item.kind === 'BOOKING_CREATED' ||
      item.kind === 'BOOKING_CANCELLED' ||
      item.kind === 'BOOKING_RESCHEDULED'
    );
  }

  private toResponseItem(item: ManagerNotificationCacheItem) {
    return {
      ...item,
      readAt: item.readAt ? new Date(item.readAt) : null,
      createdAt: new Date(item.createdAt),
    };
  }
}
