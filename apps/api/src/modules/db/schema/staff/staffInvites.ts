import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const staffInvites = pgTable('staff_invites', {
  id: uuid('id').primaryKey().defaultRandom(),

  email: text('email').notNull(),

  staffId: uuid('staff_id').notNull(),

  role: text('role').$type<'staff' | 'manager'>().notNull().default('staff'),

  token: text('token').notNull().unique(),

  accepted: boolean('accepted').default(false),

  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
