import { pgTable, uuid, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

import { publicBookings } from '../public';
import { users } from '../users';
import { clients } from '../clients';
import { notificationKindEnum, notificationTargetEnum } from './enums';
import { branches } from '../branches';

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    bookingId: uuid('booking_id').references(() => publicBookings.id, {
      onDelete: 'cascade',
    }),

    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id, {
        onDelete: 'cascade',
      }),

    target: notificationTargetEnum('target').notNull(),

    kind: notificationKindEnum('kind').notNull(),

    recipientUserId: uuid('recipient_user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),

    recipientClientId: uuid('recipient_client_id').references(
      () => clients.id,
      { onDelete: 'cascade' },
    ),

    payload: jsonb('payload')
      .$type<Record<string, any>>()
      .notNull()
      .default({}),

    readAt: timestamp('read_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    byRecipientUserCreatedAt: index(
      'notifications_by_recipient_user_created_at',
    ).on(t.recipientUserId, t.createdAt),

    byBranchCreatedAt: index('notifications_by_branch_created_at').on(
      t.branchId,
      t.createdAt,
    ),

    byRecipientClientCreatedAt: index(
      'notifications_by_recipient_client_created_at',
    ).on(t.recipientClientId, t.createdAt),

    byRecipientUserReadAt: index('notifications_by_recipient_user_read_at').on(
      t.recipientUserId,
      t.readAt,
    ),

    byRecipientClientReadAt: index(
      'notifications_by_recipient_client_read_at',
    ).on(t.recipientClientId, t.readAt),

    byBooking: index('notifications_by_booking').on(t.bookingId),
    byKind: index('notifications_by_kind').on(t.kind),
    byTarget: index('notifications_by_target').on(t.target),
  }),
);
