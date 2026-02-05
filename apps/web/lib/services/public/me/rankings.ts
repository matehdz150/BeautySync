import { publicFetch } from "../apiPublic";

/* =====================
   TYPES
===================== */

export type CreateBookingRatingInput = {
  bookingId: string;
  rating: number;
  comment?: string;
};

export type CreateBookingRatingResponse = {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
};

/* =====================
   SERVICE
===================== */

export async function createBookingRating({
  bookingId,
  rating,
  comment,
}: CreateBookingRatingInput): Promise<CreateBookingRatingResponse> {
  return publicFetch<CreateBookingRatingResponse>(
    `/rankings/${bookingId}/rating`,
    {
      method: "POST",
      body: JSON.stringify({
        rating,
        comment,
      }),
    }
  );
}