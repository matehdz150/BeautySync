import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, isNull, lt } from 'drizzle-orm';

import * as client from 'src/modules/db/client';
import { notifications } from '../db/schema/notifications/notifications';
import { notificationKindEnum } from '../db/schema';
import { ManagerNotificationCacheItem } from './notifications-cache.shared';

@Injectable()
export class NotificationsRepository {
  constructor(@Inject('DB') private readonly db: client.DB) {}

  async create(values: typeof notifications.$inferInsert) {
    const [created] = await this.db
      .insert(notifications)
      .values(values)
      .returning({
        id: notifications.id,
        bookingId: notifications.bookingId,
        branchId: notifications.branchId,
        target: notifications.target,
        kind: notifications.kind,
        payload: notifications.payload,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      });

    return created;
  }

  async findById(notificationId: string) {
    const [notification] = await this.db
      .select({
        id: notifications.id,
        bookingId: notifications.bookingId,
        branchId: notifications.branchId,
        kind: notifications.kind,
        payload: notifications.payload,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    return notification ?? null;
  }

  async markAsRead(notificationId: string, branchIds: string[]) {
    const [updated] = await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, notificationId),
          inArray(notifications.branchId, branchIds),
        ),
      )
      .returning({
        id: notifications.id,
        branchId: notifications.branchId,
        readAt: notifications.readAt,
      });

    return updated ?? null;
  }

  async findManagerLatestByBranch(
    branchId: string,
    limit = 50,
  ): Promise<ManagerNotificationCacheItem[]> {
    const rows = await this.db
      .select({
        id: notifications.id,
        bookingId: notifications.bookingId,
        branchId: notifications.branchId,
        kind: notifications.kind,
        payload: notifications.payload,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.target, 'MANAGER'),
          eq(notifications.branchId, branchId),
        ),
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return rows.map((row) => ({
      ...row,
      readAt: row.readAt ? row.readAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async findManagerFeed(params: {
    branchIds: string[];
    unread?: boolean;
    limit: number;
    cursor?: string;
    kind?: 'ALL' | 'BOOKING' | 'CHAT';
  }) {
    const conditions = [
      eq(notifications.target, 'MANAGER'),
      inArray(notifications.branchId, params.branchIds),
    ];

    if (params.unread === true) {
      conditions.push(isNull(notifications.readAt));
    }

    if (params.cursor) {
      const cursorDate = new Date(params.cursor);
      if (!Number.isNaN(cursorDate.getTime())) {
        conditions.push(lt(notifications.createdAt, cursorDate));
      }
    }

    if (params.kind && params.kind !== 'ALL') {
      const kindGroups: Record<
        'BOOKING' | 'CHAT',
        (typeof notificationKindEnum.enumValues)[number][]
      > = {
        BOOKING: [
          'BOOKING_CREATED',
          'BOOKING_CANCELLED',
          'BOOKING_RESCHEDULED',
        ],
        CHAT: ['CHAT_MESSAGE'],
      };

      conditions.push(inArray(notifications.kind, kindGroups[params.kind]));
    }

    return this.db
      .select({
        id: notifications.id,
        bookingId: notifications.bookingId,
        branchId: notifications.branchId,
        kind: notifications.kind,
        payload: notifications.payload,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(params.limit + 1);
  }
}
