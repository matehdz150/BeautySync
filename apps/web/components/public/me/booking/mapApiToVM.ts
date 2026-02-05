import { BookingDetailVM, BookingStatus } from "./details/booking-types";

/**
 * Tipado de la respuesta cruda del API
 * (solo lo que usamos)
 */
type BookingDetailApiResponse = {
  ok: boolean;
  booking: {
    id: string;
    hasRating: boolean;

    branch: {
      id: string;
      name: string;
      slug: string;
      coverUrl: string | null;
      address?: string;
    };

    paymentMethod: "ONLINE" | "ONSITE";
    notes: string | null;
    totalCents: number;

    appointments: Array<{
      id: string;
      status: BookingStatus;

      startIso: string;
      endIso: string;
      durationMin: number;
      priceCents: number;

      service: { name: string };
      staff: { name: string; avatarUrl: string | null };
    }>;
  };
};

/**
 * Convierte la respuesta del API al ViewModel
 * que consume la UI
 */
export function mapApiToVM(
  res: BookingDetailApiResponse
): BookingDetailVM {
  const b = res?.booking;

  if (!b?.id) {
    throw new Error("Booking no encontrado");
  }

  const appointments = Array.isArray(b.appointments)
    ? b.appointments
    : [];

  const sorted = [...appointments].sort(
    (a, z) =>
      new Date(a.startIso).getTime() -
      new Date(z.startIso).getTime()
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const statusPriority = (s: BookingStatus) => {
    switch (s) {
      case "CONFIRMED":
        return 5;
      case "PENDING":
        return 4;
      case "COMPLETED":
        return 3;
      case "NO_SHOW":
        return 2;
      case "CANCELLED":
        return 1;
      default:
        return 0;
    }
  };

  const status: BookingStatus =
    sorted
      .map((a) => a.status)
      .sort(
        (a, z) => statusPriority(z) - statusPriority(a)
      )[0] ?? "PENDING";

  return {
    bookingId: b.id,
    status,

    startsAtISO:
      first?.startIso ?? new Date().toISOString(),
    endsAtISO:
      last?.endIso ?? new Date().toISOString(),

    hasRating: Boolean(b.hasRating),

    itemsCount: sorted.length,
    totalPriceCents: Number(b.totalCents ?? 0),

    paymentMethod: b.paymentMethod ?? "ONSITE",
    notes: b.notes ?? null,

    branch: {
      id: b.branch.id,
      name: b.branch.name,
      slug: b.branch.slug,
      coverUrl: b.branch.coverUrl,
      address: b.branch.address,
    },

    appointments: sorted.map((a) => ({
      id: a.id,
      status: a.status,
      startIso: a.startIso,
      endIso: a.endIso,
      durationMin: a.durationMin,
      priceCents: a.priceCents ?? 0,
      serviceName: a.service?.name ?? "Servicio",
      staffName: a.staff?.name ?? "Staff",
      staffAvatarUrl: a.staff?.avatarUrl ?? null,
    })),
  };
}