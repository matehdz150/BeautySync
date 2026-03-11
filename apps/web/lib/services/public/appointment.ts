import { DateTime } from "luxon";
import { publicFetch } from "./apiPublic";
import { getOwnerToken } from "@/hooks/use-getOwnerToken";

/* =====================
   TYPES
===================== */

export type PublicPaymentMethod = "ONSITE" | "ONLINE";

export type PublicAppointmentDraft = {
  serviceId: string;
  staffId: string;
  startIso: string;
  endIso: string;
  durationMin: number;
};

export type CreatePublicBookingPayload = {
  branchSlug: string;
  date: string;
  paymentMethod: PublicPaymentMethod;
  discountCode?: string | null;
  notes?: string | null;
  appointments: PublicAppointmentDraft[];
};

export type CreatePublicBookingRequest = CreatePublicBookingPayload & {
  ownerToken: string;
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

  const ownerToken = getOwnerToken();

  return publicFetch<CreatePublicBookingResponse>(`/public/booking/appointments`, {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      ownerToken,
    }),
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

export async function reschedulePublicBooking(params: {
  bookingId: string;
  date: string;      // YYYY-MM-DD (local)
  time: string;      // HH:mm
  notes?: string;
}) {
  const { bookingId, date, time, notes } = params;

  if (!bookingId) {
    throw new Error("bookingId is required");
  }

  const newStartIso = DateTime
    .fromISO(`${date}T${time}`, { zone: "America/Mexico_City" })
    .toUTC()
    .toISO();

  return publicFetch<{
    ok: true;
    bookingId: string;
    startsAt: string;
    endsAt: string;
  }>(`/public/booking/${bookingId}/reschedule`, {
    method: "POST",
    body: JSON.stringify({
      newStartIso,
      notes,
    }),
  });
}