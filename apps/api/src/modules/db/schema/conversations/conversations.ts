import {
  pgTable,
  uuid,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { publicBookings } from '../public';
import { conversationStatusEnum } from '../notifications/enums';

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    bookingId: uuid('booking_id')
      .notNull()
      .references(() => publicBookings.id, { onDelete: 'cascade' }),

    status: conversationStatusEnum('status').notNull().default('ACTIVE'),

    archivedAt: timestamp('archived_at', { withTimezone: true }),

    // 🔥 clave para inbox
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqBooking: uniqueIndex('conversations_uniq_booking').on(t.bookingId),

    byStatus: index('conversations_by_status').on(t.status),

    // 🔥 inbox sorting index
    byLastMessage: index('conversations_by_last_message').on(t.lastMessageAt),

    byCreatedAt: index('conversations_by_created_at').on(t.createdAt),
  }),
);
