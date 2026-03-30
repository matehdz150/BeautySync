import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  text,
} from 'drizzle-orm/pg-core';
import { branches } from '../branches';
import { publicUsers } from '../public';

export const giftCards = pgTable('gift_cards', {
  id: uuid('id').defaultRandom().primaryKey(),

  branchId: uuid('branch_id')
    .notNull()
    .references(() => branches.id),

  code: varchar('code', { length: 32 }).notNull().unique(),

  initialAmountCents: integer('initial_amount_cents').notNull(),

  // 🔥 dinero disponible
  balanceCents: integer('balance_cents').notNull(),

  currency: varchar('currency', { length: 3 }).default('MXN'),

  status: varchar('status', { length: 20 })
    .$type<'active' | 'redeemed' | 'expired' | 'cancelled'>()
    .default('active'),

  expiresAt: timestamp('expires_at'),

  // 🔥 dueño (opcional)
  ownerUserId: uuid('owner_user_id').references(() => publicUsers.id),

  note: text('note'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
