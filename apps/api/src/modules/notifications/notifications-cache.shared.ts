import type Redis from 'ioredis';

export const NOTIFICATIONS_BRANCH_LATEST_MAX_ITEMS = 50;
export const NOTIFICATIONS_BRANCH_LATEST_TTL_SECONDS = 60 * 60 * 24;
export const NOTIFICATIONS_ITEM_TTL_SECONDS = 60 * 60 * 24;

export type ManagerNotificationCacheItem = {
  id: string;
  bookingId: string | null;
  branchId: string;
  kind: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export function buildNotificationsBranchLatestKey(branchId: string) {
  return `notifications:branch:${branchId}`;
}

export function buildNotificationsBranchWarmKey(branchId: string) {
  return `notifications:branch:${branchId}:warm`;
}

export function buildNotificationItemKey(notificationId: string) {
  return `notifications:id:${notificationId}`;
}

export function toManagerNotificationCacheItem(notification: {
  id: string;
  bookingId: string | null;
  branchId: string;
  kind: string;
  payload: Record<string, unknown>;
  readAt: Date | string | null;
  createdAt: Date | string;
}): ManagerNotificationCacheItem {
  return {
    id: notification.id,
    bookingId: notification.bookingId,
    branchId: notification.branchId,
    kind: notification.kind,
    payload: notification.payload,
    readAt:
      notification.readAt instanceof Date
        ? notification.readAt.toISOString()
        : notification.readAt,
    createdAt:
      notification.createdAt instanceof Date
        ? notification.createdAt.toISOString()
        : notification.createdAt,
  };
}

export async function setManagerBranchLatest(
  redis: Redis,
  branchId: string,
  items: ManagerNotificationCacheItem[],
) {
  const listKey = buildNotificationsBranchLatestKey(branchId);
  const warmKey = buildNotificationsBranchWarmKey(branchId);
  const cappedItems = items.slice(0, NOTIFICATIONS_BRANCH_LATEST_MAX_ITEMS);
  const multi = redis.multi();

  multi.del(listKey);

  if (cappedItems.length) {
    multi.rpush(listKey, ...cappedItems.map((item) => JSON.stringify(item)));
    multi.expire(listKey, NOTIFICATIONS_BRANCH_LATEST_TTL_SECONDS);
    for (const item of cappedItems) {
      multi.set(
        buildNotificationItemKey(item.id),
        JSON.stringify(item),
        'EX',
        NOTIFICATIONS_ITEM_TTL_SECONDS,
      );
    }
  }

  multi.set(warmKey, '1', 'EX', NOTIFICATIONS_BRANCH_LATEST_TTL_SECONDS);
  await multi.exec();
}

export async function prependManagerBranchLatest(
  redis: Redis,
  item: ManagerNotificationCacheItem,
) {
  const listKey = buildNotificationsBranchLatestKey(item.branchId);
  const warmKey = buildNotificationsBranchWarmKey(item.branchId);
  const multi = redis.multi();

  multi.lpush(listKey, JSON.stringify(item));
  multi.ltrim(listKey, 0, NOTIFICATIONS_BRANCH_LATEST_MAX_ITEMS - 1);
  multi.expire(listKey, NOTIFICATIONS_BRANCH_LATEST_TTL_SECONDS);
  multi.set(
    buildNotificationItemKey(item.id),
    JSON.stringify(item),
    'EX',
    NOTIFICATIONS_ITEM_TTL_SECONDS,
  );
  multi.set(warmKey, '1', 'EX', NOTIFICATIONS_BRANCH_LATEST_TTL_SECONDS);

  await multi.exec();
}

export async function markManagerBranchLatestAsRead(
  redis: Redis,
  params: {
    branchId: string;
    notificationId: string;
    readAt: string;
  },
) {
  const listKey = buildNotificationsBranchLatestKey(params.branchId);
  const rawItems = await redis.lrange(
    listKey,
    0,
    NOTIFICATIONS_BRANCH_LATEST_MAX_ITEMS - 1,
  );

  if (!rawItems.length) {
    return;
  }

  let changed = false;
  const nextItems = rawItems.map((rawItem) => {
    const parsed = JSON.parse(rawItem) as ManagerNotificationCacheItem;
    if (parsed.id !== params.notificationId) {
      return parsed;
    }

    changed = true;
    return {
      ...parsed,
      readAt: params.readAt,
    };
  });

  if (!changed) {
    return;
  }

  await setManagerBranchLatest(redis, params.branchId, nextItems);

  const updatedItem = nextItems.find((item) => item.id === params.notificationId);
  if (updatedItem) {
    await redis.set(
      buildNotificationItemKey(updatedItem.id),
      JSON.stringify(updatedItem),
      'EX',
      NOTIFICATIONS_ITEM_TTL_SECONDS,
    );
  }
}
