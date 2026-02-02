/* eslint-disable prettier/prettier */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';

import { publicBookings } from './public-bookings';
import { publicUsers } from './public-users';

export type BookingRescheduleReason =
  | 'CLIENT_REQUEST'
  | 'STAFF_REQUEST'
  | 'SYSTEM'
  | 'ADMIN';

export const bookingReschedules = pgTable(
  'booking_reschedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // 🔗 booking que sigue vivo
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => publicBookings.id, { onDelete: 'cascade' }),

    // quién reagendó (puede ser null si es sistema)
    rescheduledByPublicUserId: uuid('rescheduled_by_public_user_id')
      .references(() => publicUsers.id, { onDelete: 'set null' }),

    reason: text('reason').$type<BookingRescheduleReason>(),

    // 🧊 SNAPSHOTS
    previousBookingSnapshot: jsonb('previous_booking_snapshot').notNull(),
    newBookingSnapshot: jsonb('new_booking_snapshot').notNull(),

    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    bookingIdx: index('booking_reschedules_booking_idx').on(table.bookingId),
    createdAtIdx: index('booking_reschedules_created_at_idx').on(
      table.createdAt,
    ),
  }),
);