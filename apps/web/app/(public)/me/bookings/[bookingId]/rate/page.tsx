"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RatingPanel } from "@/components/public/me/booking/rating/RatingPanel";
import { getMyPublicBookingById } from "@/lib/services/public/me/appointments";
import { createBookingRating } from "@/lib/services/public/me/rankings";
import { RatingPanelReview } from "@/components/public/me/booking/rating/RatingPanelReview";
// 👉 aquí iría tu service real
// import { createBookingRating } from "@/lib/services/public/rating";

type BookingRating = {
  rating: number;
  comment?: string;
};

export default function BookingRatePage() {
  const router = useRouter();
  const { bookingId } = useParams<{ bookingId: string }>();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [booking, setBooking] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* =====================
     LOAD BOOKING
  ===================== */

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!bookingId) return;

      try {
        setLoading(true);
        const res = await getMyPublicBookingById(bookingId);
        if (!alive) return;

        setBooking(res.booking);
      } catch (err: any) {
        if (!alive) return;
        setErrorMsg(err?.message ?? "No se pudo cargar la cita");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [bookingId]);

  /* =====================
     DERIVED
  ===================== */

  const status = booking?.appointments?.[0]?.status;
  const isCompleted = status === "COMPLETED";

  const existingRating: BookingRating | null =
    booking?.rating
      ? {
          rating: booking.rating.value,
          comment: booking.rating.comment,
        }
      : null;

  const bookingDate = useMemo(() => {
    if (!booking) return undefined;
    return new Date(
      booking.appointments[0].startIso
    ).toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [booking]);

  const servicesSummary = booking?.appointments
    ?.map((a: any) => a.service.name)
    .join(", ");

  const staffSummary = booking?.appointments
    ?.map((a: any) => a.staff?.name)
    .filter(Boolean)
    .join(", ");

  /* =====================
     ACTIONS
  ===================== */

  async function handleSubmit(rating: number, comment?: string) {
  if (!bookingId) return;

  try {
    setSubmitting(true);

    await createBookingRating({
      bookingId,
      rating,
      comment: comment?.trim() || undefined,
    });

    router.push(`/me/bookings/${bookingId}`);
  } catch (err) {
    console.error(err);

    if (err instanceof Error) {
      alert(err.message);
    } else {
      alert("No se pudo enviar la calificación");
    }
  } finally {
    setSubmitting(false);
  }
}

  function handleClose() {
    router.push(`/me/bookings/${bookingId}`);
  }

  /* =====================
     STATES
  ===================== */

  if (loading) {
    return (
      <div className="rounded-[28px] border border-black/5 bg-white p-6">
        <div className="flex items-center gap-3 text-sm text-black/60">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando cita…
        </div>
      </div>
    );
  }

  if (errorMsg || !booking) {
    return (
      <div className="rounded-[28px] border border-black/5 bg-white p-6">
        <p className="text-sm font-semibold">No se pudo cargar</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {errorMsg ?? "Cita no encontrada"}
        </p>

        <Button className="mt-5 rounded-full" onClick={handleClose}>
          Volver
        </Button>
      </div>
    );
  }

  if (!isCompleted) {
    return (
      <div className="rounded-[28px] border border-black/5 bg-white p-6">
        <p className="text-base font-semibold">
          Esta cita aún no puede calificarse
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Solo las citas completadas pueden recibir una calificación.
        </p>

        <Button className="mt-6 rounded-full" onClick={handleClose}>
          Volver
        </Button>
      </div>
    );
  }

  /* =====================
     ALREADY RATED
  ===================== */

  if (existingRating) {
  return (
    <RatingPanelReview
      branchName={booking.branch.name}
      coverUrl={booking.branch.imageUrl}
      rating={existingRating.rating}
      comment={existingRating.comment}
      bookingDate={bookingDate}
      servicesSummary={servicesSummary}
      staffSummary={staffSummary}
      onClose={handleClose}
    />
  );
}

  /* =====================
     RENDER RATE FORM
  ===================== */

  return (
    <RatingPanel
      branchName={booking.branch.name}
      coverUrl={booking.branch.imageUrl}
      bookingDate={bookingDate}
      servicesSummary={servicesSummary}
      staffSummary={staffSummary}
      onSubmit={handleSubmit}
    />
  );
}