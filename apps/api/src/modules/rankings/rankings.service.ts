import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { db } from '../db/client';

import { publicBookings } from '../db/schema/public/public-bookings';
import { appointments } from '../db/schema/appointments/appointments';
import { publicBookingRatings } from '../db/schema/rankings/public_booking_ratings';
import { publicBookingRatingStaff } from '../db/schema/rankings/public_booking_rating_staff';

type CreateBookingRatingInput = {
  bookingId: string;
  publicUserId: string;
  rating: number;
  comment?: string;
};

@Injectable()
export class RankingsService {
  async createBookingRating({
    bookingId,
    publicUserId,
    rating,
    comment,
  }: CreateBookingRatingInput) {
    /* ============================
       Validate rating value
    ============================ */
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    /* ============================
       Fetch booking
    ============================ */
    const booking = await db.query.publicBookings.findFirst({
      where: eq(publicBookings.id, bookingId),
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    /* ============================
       Ownership check
    ============================ */
    if (booking.publicUserId !== publicUserId) {
      throw new ForbiddenException('You cannot rate this booking');
    }

    /* ============================
       Status check
    ============================ */
    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException('Only completed bookings can be rated');
    }

    /* ============================
       Already rated?
    ============================ */
    const existing = await db.query.publicBookingRatings.findFirst({
      where: eq(publicBookingRatings.bookingId, bookingId),
    });

    if (existing) {
      throw new BadRequestException('Booking already rated');
    }

    /* ============================
       Get staff involved
    ============================ */
    const bookingAppointments = await db.query.appointments.findMany({
      where: eq(appointments.publicBookingId, bookingId),
      columns: { staffId: true },
    });

    const staffIds = [...new Set(bookingAppointments.map((a) => a.staffId))];

    /* ============================
       Transaction
    ============================ */
    return await db.transaction(async (tx) => {
      /* ---- create rating ---- */
      const [ratingRow] = await tx
        .insert(publicBookingRatings)
        .values({
          bookingId,
          publicUserId,
          branchId: booking.branchId,
          rating,
          comment,
        })
        .returning();

      /* ---- link staff ---- */
      if (staffIds.length > 0) {
        await tx.insert(publicBookingRatingStaff).values(
          staffIds.map((staffId) => ({
            ratingId: ratingRow.id,
            staffId,
          })),
        );
      }

      return ratingRow;
    });
  }
}
