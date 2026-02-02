"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CalendarSync, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  reschedulePublicBooking,
  type PublicBooking,
} from "@/lib/services/public/appointment";
import { getMyPublicBookingById } from "@/lib/services/public/me/appointments";
import { RescheduleTimeSlots } from "@/components/book/RescheduleTimeSlots";
import { AvailabilityChainPlan } from "@/lib/services/public/availability";
import { RescheduleDatePicker } from "@/components/book/RescheduleDatePicker";

/* =====================
   PAGE
===================== */

export default function BookingReschedulePage() {
  const router = useRouter();
  const params = useParams<{ bookingId: string }>();
  const bookingId = params?.bookingId;

  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] =
    useState<AvailabilityChainPlan | null>(null);

  const [rescheduling, setRescheduling] = useState(false);

  /* =====================
     LOAD BOOKING
  ===================== */

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!bookingId) return;

      setLoading(true);
      setErrorMsg(null);

      try {
        const res = await getMyPublicBookingById(bookingId);
        if (!alive) return;
        setBooking(res.booking);
        setSelectedDate(res.booking.date);
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

  const requiredDurationMin = useMemo(() => {
    if (!booking) return 0;
    return booking.appointments.reduce((acc, a) => acc + a.durationMin, 0);
  }, [booking]);

  function handleClose() {
    router.push(`/me/bookings/${bookingId}`);
  }

  async function handleConfirmReschedule() {
    if (!bookingId || !selectedDate || !selectedPlan) return;

    const startLocalIso = selectedPlan.startLocalIso ?? selectedPlan.startIso;

    const time = startLocalIso.slice(11, 16); // HH:mm

    const confirmed = window.confirm("¿Confirmar reagendación de tu cita?");

    if (!confirmed) return;

    try {
      setRescheduling(true);

      await reschedulePublicBooking({
        bookingId,
        date: selectedDate, // YYYY-MM-DD
        time, // HH:mm
      });

      // ✅ éxito → volver al detalle
      router.push(`/me/bookings/${bookingId}`);
    } catch (err) {
      console.error(err);
      alert("No se pudo reagendar la cita. Intenta de nuevo.");
    } finally {
      setRescheduling(false);
    }
  }

  /* =====================
     LOADING / ERROR
  ===================== */

  if (loading) {
    return (
      <div className="w-full rounded-[28px] border border-black/5 bg-white p-6 sm:p-10">
        <div className="flex items-center gap-3 text-sm text-black/60">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando cita…
        </div>
      </div>
    );
  }

  if (errorMsg || !booking) {
    return (
      <div className="w-full rounded-[28px] border border-black/5 bg-white p-6 sm:p-10">
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

  /* =====================
     RENDER
  ===================== */

  return (
    <>
      {/* Animaciones globales */}
      <style jsx global>{`
        @keyframes bsCoverIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(1.01);
            filter: blur(2px);
          }
          to {
            opacity: 1;
            transform: translateY(0px) scale(1);
            filter: blur(0px);
          }
        }

        @keyframes bsFadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0px);
          }
        }

        @keyframes bsSoftPop {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
        }
      `}</style>

      <div className="w-full">
        {/* Body */}
        <div
          className="p-4 sm:p-6 lg:p-8"
          style={{ animation: "bsFadeUp 280ms ease-out both" }}
        >
          {/* Cita actual */}
          <div
            className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6"
            style={{ animation: "bsSoftPop 240ms ease-out both" }}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600">
                <CalendarSync className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">Cita actual</p>

                {/* Fecha y hora */}
                <p className="mt-0.5 text-base font-semibold tracking-tight">
                  {new Date(
                    booking.appointments[0].startIso
                  ).toLocaleDateString("es-MX", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  ·{" "}
                  {new Date(
                    booking.appointments[0].startIso
                  ).toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                {/* Servicios */}
                <p className="mt-1 text-sm text-black/60 truncate">
                  {booking.appointments.map((a) => a.service.name).join(" · ")}
                </p>

                {/* Staff + duración */}
                <p className="mt-1 text-xs text-black/45">
                  {booking.appointments[0].staff?.name
                    ? `Con ${booking.appointments[0].staff.name}`
                    : "Staff asignado"}{" "}
                  ·{" "}
                  {requiredDurationMin < 60
                    ? `${requiredDurationMin} min`
                    : `${Math.floor(requiredDurationMin / 60)}h ${
                        requiredDurationMin % 60 || ""
                      }`.trim()}
                </p>
              </div>
            </div>
          </div>

          {/* DATE PICKER */}
          <div className="mt-6">
            <RescheduleDatePicker
              branchSlug={booking.branch.slug}
              requiredDurationMin={requiredDurationMin}
              selectedDate={selectedDate ?? undefined}
              onSelect={(date) => {
                setSelectedDate(date);
                setSelectedPlan(null); // 🔑 importante
              }}
            />
          </div>

          {/* TIME SLOTS PLACEHOLDER */}
          <div className="mt-6">
            <RescheduleTimeSlots
              booking={booking}
              selectedDate={selectedDate}
              selectedPlan={selectedPlan}
              onSelectPlan={setSelectedPlan}
            />
          </div>

          {/* ACTION */}
          <div className="mt-6">
            <Button
              className="w-full rounded-full"
              disabled={!selectedDate || !selectedPlan || rescheduling}
              onClick={handleConfirmReschedule}
            >
              {rescheduling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reagendando…
                </>
              ) : (
                "Confirmar reagendación"
              )}
            </Button>
          </div>

          <div className="h-6" />
        </div>
      </div>
    </>
  );
}
