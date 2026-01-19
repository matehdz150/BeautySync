import { publicFetch } from "../apiPublic";

/* =====================
   TYPES (LIST)
===================== */

export type PublicAppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "NO_SHOW"
  | "COMPLETED";

export type PublicAppointmentListItem = {
  id: string;
  status: PublicAppointmentStatus;

  branchName: string;

  startsAtISO: string;
  endsAtISO: string;

  priceCents: number | null;

  itemsCount: number; // en tu caso puede ser 1, o puedes agrupar por booking
  coverUrl: string | null;

  publicBookingId: string | null;
};

export type PublicAppointmentsListResponse = {
  items: PublicAppointmentListItem[];
  nextCursor: string | null;
};

export type GetMyPublicAppointmentsQuery = {
  tab?: "UPCOMING" | "PAST";
  limit?: number;
  cursor?: string;
};

/* =====================
   TYPES (DETAIL BOOKING)
===================== */

export type PublicBookingPaymentMethod = "ONLINE" | "ONSITE";

export type PublicBookingAppointmentItem = {
  id: string;

  startIso: string; // ISO local (branch tz)
  endIso: string; // ISO local (branch tz)

  durationMin: number;
  priceCents: number;

  status: PublicAppointmentStatus;

  service: {
    id: string;
    name: string;
  };

  staff: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
};

export type PublicBookingDetailResponse = {
  ok: true;
  booking: {
    id: string;

    branch: {
      slug: string;
      name: string;
      address: string;
      imageUrl: string | null;
    };

    date: string; // YYYY-MM-DD
    paymentMethod: PublicBookingPaymentMethod;
    notes: string | null;

    totalCents: number;

    appointments: PublicBookingAppointmentItem[];
  };
};

/* =====================
   API FUNCTIONS
===================== */

export async function getMyPublicAppointments(
  query?: GetMyPublicAppointmentsQuery
): Promise<PublicAppointmentsListResponse> {
  const params = new URLSearchParams();

  if (query?.tab) params.set("tab", query.tab);
  if (typeof query?.limit === "number") params.set("limit", String(query.limit));
  if (query?.cursor) params.set("cursor", query.cursor);

  const qs = params.toString();
  const path = `/public/appointments/me${qs ? `?${qs}` : ""}`;

  return publicFetch<PublicAppointmentsListResponse>(path, {
    method: "GET",
  });
}

export async function getMyPublicBookingById(
  bookingId: string
): Promise<PublicBookingDetailResponse> {
  if (!bookingId) throw new Error("bookingId is required");

  return publicFetch<PublicBookingDetailResponse>(
    `/public/appointments/bookings/${bookingId}`,
    { method: "GET" }
  );
}
