import { pgTable, uuid, timestamp, text, index } from 'drizzle-orm/pg-core';
import { publicUsers } from './public-users';

export const publicSessions = pgTable(
  'public_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    publicUserId: uuid('public_user_id')
      .notNull()
      .references(() => publicUsers.id, { onDelete: 'cascade' }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),

    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

    // opcional pero útil
    userAgent: text('user_agent'),
    ip: text('ip'),
  },
  (t) => ({
    userIdx: index('public_sessions_user_idx').on(t.publicUserId),
    expiresIdx: index('public_sessions_expires_idx').on(t.expiresAt),
  }),
);
