/* eslint-disable prettier/prettier */
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

import { branches } from '../branches/branches';
import { publicUsers } from './public-users';

export type PublicBookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'COMPLETED';

export type PublicBookingPaymentMethod = 'ONSITE' | 'ONLINE';

export const publicBookings = pgTable(
  'public_bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'cascade' }),

    publicUserId: uuid('public_user_id')
      .references(() => publicUsers.id, { onDelete: 'cascade' }),

    // rango completo del booking
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),

    status: text('status')
      .$type<PublicBookingStatus>()
      .notNull()
      .default('PENDING'),

    paymentMethod: text('payment_method')
      .$type<PublicBookingPaymentMethod>()
      .notNull()
      .default('ONSITE'),

    totalCents: integer('total_cents').notNull().default(0),

    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    publicUserStartsAtIdx: index(
      'public_bookings_public_user_starts_at_idx',
    ).on(table.publicUserId, table.startsAt),
    branchStartsAtIdx: index('public_bookings_branch_starts_at_idx').on(
      table.branchId,
      table.startsAt,
    ),
    statusIdx: index('public_bookings_status_idx').on(table.status),
  }),
);
