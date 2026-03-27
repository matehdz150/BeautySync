import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
  index,
  numeric,
} from 'drizzle-orm/pg-core';

import { publicBookings } from '../public';
import { publicUsers } from '../public';
import { branches } from '../branches/branches';

export const publicBookingRatings = pgTable(
  'public_booking_ratings',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // 🔗 Booking calificado
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => publicBookings.id, { onDelete: 'cascade' }),

    // 👤 Usuario público
    publicUserId: uuid('public_user_id')
      .notNull()
      .references(() => publicUsers.id, { onDelete: 'cascade' }),

    // 🏬 Branch afectado
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'cascade' }),

    // ⭐ Rating único (1–5)
    rating: numeric('rating', { precision: 2, scale: 1 }).notNull(),

    // 💬 Comentario opcional
    comment: text('comment'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    // 🔒 Un booking solo se califica una vez
    bookingUnique: uniqueIndex('public_booking_ratings_booking_unique').on(
      table.bookingId,
    ),

    branchIdx: index('public_booking_ratings_branch_idx').on(table.branchId),
    userIdx: index('public_booking_ratings_user_idx').on(table.publicUserId),
  }),
);
