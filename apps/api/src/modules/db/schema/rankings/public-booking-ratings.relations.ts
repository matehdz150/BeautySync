import { relations } from 'drizzle-orm';

import { publicBookingRatings } from './public_booking_ratings';
import { publicBookings } from '../public';
import { publicUsers } from '../public';
import { branches } from '../branches/branches';
import { publicBookingRatingStaff } from './public_booking_rating_staff';

export const publicBookingRatingsRelations = relations(
  publicBookingRatings,
  ({ one, many }) => ({
    // 🔗 Booking calificado
    booking: one(publicBookings, {
      fields: [publicBookingRatings.bookingId],
      references: [publicBookings.id],
    }),

    // 👤 Usuario público
    publicUser: one(publicUsers, {
      fields: [publicBookingRatings.publicUserId],
      references: [publicUsers.id],
    }),

    // 🏬 Branch afectado
    branch: one(branches, {
      fields: [publicBookingRatings.branchId],
      references: [branches.id],
    }),

    // 👨‍🔧 Staff afectados (via tabla puente)
    staffRatings: many(publicBookingRatingStaff),
  }),
);
