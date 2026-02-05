"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { getMyPublicBookingById } from "@/lib/services/public/me/appointments";
import { cancelPublicBooking } from "@/lib/services/appointments";

import { BookingHeader } from "@/components/public/me/booking/details/BookingHeader";
import { BookingStatusBadge } from "@/components/public/me/booking/details/BookingStatusBadge";
import { BookingActions } from "@/components/public/me/booking/details/BookingActions";
import { BookingSummary } from "@/components/public/me/booking/details/BookingSummary";
import { BookingDetails } from "@/components/public/me/booking/details/BookingDetails";

import { statusConfigMap } from "@/components/public/me/booking/details/status";
import { BookingDetailVM } from "@/components/public/me/booking/details/booking-types";
import { mapApiToVM } from "@/components/public/me/booking/mapApiToVM";
import { RatingModal } from "@/components/public/me/booking/rating/RatingModal";

export default function BookingDetailPage() {
  const router = useRouter();
  const { bookingId } = useParams<{ bookingId: string }>();

  const [booking, setBooking] = useState<BookingDetailVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await getMyPublicBookingById(bookingId);
      setBooking(mapApiToVM(res as any));
      setLoading(false);
    }
    load();
  }, [bookingId]);

  useEffect(() => {
    if (!booking) return;

    if (booking.status === "COMPLETED" && !booking.hasRating) {
      setShowRatingModal(true);
    }
  }, [booking]);

  async function handleCancel() {
    if (!booking) return;
    setCancelling(true);
    await cancelPublicBooking(booking.bookingId);
    router.push("/me/bookings");
  }

  function formatFriendlyDate(iso: string) {
    const date = new Date(iso);

    const datePart = new Intl.DateTimeFormat("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date);

    const timePart = new Intl.DateTimeFormat("es-MX", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .format(date)
      .toLowerCase(); // am / pm en minúsculas

    // Capitalizar el día
    const capitalized = datePart.charAt(0).toUpperCase() + datePart.slice(1);

    return `${capitalized} a las ${timePart}`;
  }

  function formatDuration(startsAtISO: string, endsAtISO: string) {
    const start = new Date(startsAtISO).getTime();
    const end = new Date(endsAtISO).getTime();

    const minutes = Math.max(0, Math.round((end - start) / 60000));

    if (!Number.isFinite(minutes) || minutes <= 0) {
      return "Duración por confirmar";
    }

    if (minutes < 60) {
      return `${minutes} min de duración`;
    }

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;

    if (rest === 0) {
      return `${hours} h de duración`;
    }

    return `${hours} h ${rest} min de duración.`;
  }

  if (loading || !booking) return null;

  const statusConfig = statusConfigMap[booking.status];

  return (
    <div className="w-full">
      <BookingHeader
        coverUrl={booking.branch.coverUrl}
        title={booking.branch.name}
        onClose={() => router.push("/me/bookings")}
      />

      <div className="p-6">
        <BookingStatusBadge {...statusConfig.badge} />

        <h2 className="mt-4 text-3xl font-semibold">
          {formatFriendlyDate(booking.startsAtISO)}
        </h2>

        <p className="mt-1 text-base text-black/50">
          {formatDuration(booking.startsAtISO, booking.endsAtISO)}
        </p>

        <BookingActions
          booking={booking}
          cancelling={cancelling}
          onCancel={handleCancel}
        />

        <BookingSummary booking={booking} />
        <BookingDetails booking={booking} />
      </div>
      <RatingModal
  open={showRatingModal}
  onClose={() => setShowRatingModal(false)}
  branchName={booking.branch.name}
  bookingDate={new Date(booking.startsAtISO).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  })}
  servicesSummary={booking.appointments
    .map(a => a.serviceName)
    .join(", ")}
  staffSummary={booking.appointments
    .map(a => a.staffName)
    .join(", ")}
  onSubmit={(rating, comment) => {
    // POST rating
  }}
/>
    </div>
  );
}
