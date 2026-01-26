import { publicFetch } from "./apiPublic";

/* =====================
   TYPES
===================== */

export type PublicPaymentMethod = "ONSITE" | "ONLINE";

export type PublicAppointmentDraft = {
  serviceId: string;
  staffId: string; // puede ser staffId real (ya asignado en chain)
  startIso: string; // ISO local (-06:00)
  endIso: string; // ISO local (-06:00)
  durationMin: number;
};

export type CreatePublicBookingPayload = {
  branchSlug: string;
  date: string; // YYYY-MM-DD
  paymentMethod: PublicPaymentMethod;
  discountCode?: string | null;
  notes?: string | null;
  appointments: PublicAppointmentDraft[];
};

export type CreatePublicBookingResponse = {
  ok: true;
  bookingId: string;
};

/* =====================
   API
===================== */

export async function createPublicBooking(
  payload: CreatePublicBookingPayload
): Promise<CreatePublicBookingResponse> {
  return publicFetch<CreatePublicBookingResponse>(`/public/booking/appointments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type PublicBookingAppointment = {
  id: string;

  startIso: string; // ISO local (en tz del branch)
  endIso: string; // ISO local (en tz del branch)
  durationMin: number;

  priceCents: number | null;

  service: {
    id: string;
    name: string;
  };

  staff: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  } | null;
};

export type PublicBooking = {
  id: string;

  date: string; // YYYY-MM-DD (tz del branch)
  paymentMethod: PublicPaymentMethod;
  notes: string | null;

  totalCents: number;

  branch: {
    slug: string;
    name: string;
    address: string;
    imageUrl?: string,
  };

  appointments: PublicBookingAppointment[];
};

export type GetPublicBookingResponse = {
  ok: true;
  booking: PublicBooking;
};

export async function getPublicBookingById(
  bookingId: string
): Promise<GetPublicBookingResponse> {
  if (!bookingId) {
    throw new Error("bookingId is required");
  }

  return publicFetch<GetPublicBookingResponse>(
    `/public/bookings/${bookingId}`
  );
}