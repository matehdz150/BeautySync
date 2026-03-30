import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  text,
} from 'drizzle-orm/pg-core';
import { giftCards } from './gift-card';

export const giftCardTransactions = pgTable('gift_card_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),

  giftCardId: uuid('gift_card_id')
    .notNull()
    .references(() => giftCards.id),

  type: varchar('type', { length: 20 })
    .$type<'issue' | 'redeem' | 'refund' | 'adjustment'>()
    .notNull(),

  // 🔥 SIEMPRE positivo
  amountCents: integer('amount_cents').notNull(),

  // 🔥 referencia flexible
  referenceType: varchar('reference_type', { length: 20 }).$type<
    'booking' | 'order' | 'manual'
  >(),

  referenceId: uuid('reference_id'),

  note: text('note'),

  createdAt: timestamp('created_at').defaultNow(),
});
