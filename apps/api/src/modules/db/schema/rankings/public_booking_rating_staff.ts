import { pgTable, uuid, uniqueIndex, index } from 'drizzle-orm/pg-core';

import { publicBookingRatings } from './public_booking_ratings';
import { staff } from '../staff';

export const publicBookingRatingStaff = pgTable(
  'public_booking_rating_staff',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // 🔗 Rating del booking
    ratingId: uuid('rating_id')
      .notNull()
      .references(() => publicBookingRatings.id, { onDelete: 'cascade' }),

    // 👨‍🔧 Staff impactado
    staffId: uuid('staff_id')
      .notNull()
      .references(() => staff.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    // ❗ evitar duplicar staff por rating
    ratingStaffUnique: uniqueIndex('public_booking_rating_staff_unique').on(
      table.ratingId,
      table.staffId,
    ),

    staffIdx: index('public_booking_rating_staff_staff_idx').on(table.staffId),
  }),
);
