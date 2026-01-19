"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  RotateCcw,
  Store,
  ChevronRight,
  Check,
} from "lucide-react";
import { getPublicBookingById } from "@/lib/services/public/appointment";
import { motion } from "framer-motion";

/* =====================
   HELPERS
===================== */

function formatDateLabel(dateIso: string) {
  return new Date(dateIso).toLocaleDateString("es-MX", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatHourLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatMoneyMXN(cents: number) {
  return `${Math.round(cents / 100)} MXN`;
}

/* =====================
   ANIMATIONS
===================== */

const pageStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.02 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.28, ease: "easeOut" } },
};

/* =====================
   PAGE
===================== */

export default function BookingSuccessMobilePage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();

  const slug = params.slug;
  const bookingId = searchParams.get("bookingId") ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      setError("No se encontró bookingId en la URL.");
      return;
    }

    setLoading(true);
    setError(null);

    getPublicBookingById(bookingId)
      .then((res) => setBooking(res.booking))
      .catch((e: any) =>
        setError(e?.message ?? "No se pudo cargar la reservación.")
      )
      .finally(() => setLoading(false));
  }, [bookingId]);

  const timeRange = useMemo(() => {
    if (!booking?.appointments?.length) return null;

    const sorted = [...booking.appointments].sort((a: any, b: any) =>
      a.startIso.localeCompare(b.startIso)
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    return {
      start: formatHourLabel(first.startIso),
      end: formatHourLabel(last.endIso),
    };
  }, [booking]);

  const durationLabel = useMemo(() => {
    if (!booking?.appointments?.length) return "";
    const totalMin = booking.appointments.reduce(
      (acc: number, a: any) => acc + (a.durationMin ?? 0),
      0
    );

    if (totalMin <= 0) return "";
    if (totalMin < 60) return `${totalMin} min de duración`;

    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;

    if (mins === 0) return `${hours} hora${hours > 1 ? "s" : ""} de duración`;
    return `${hours}h ${mins}min de duración`;
  }, [booking]);

  const headerDateLabel = useMemo(() => {
    if (!booking?.appointments?.length) return "";

    const sorted = [...booking.appointments].sort((a: any, b: any) =>
      a.startIso.localeCompare(b.startIso)
    );

    const first = sorted[0];

    const dateLabel = formatDateLabel(first.startIso);
    const hourLabel = formatHourLabel(first.startIso);

    return `${dateLabel} a las ${hourLabel}`;
  }, [booking]);

  /* =====================
     RENDER STATES
  ===================== */

  if (loading) {
    return (
      <div className="min-h-dvh bg-white">
        <div className="h-[260px] w-full bg-gray-200 animate-pulse" />
        <div className="px-5 pt-5 space-y-4">
          <div className="h-8 w-40 rounded-full bg-black/10" />
          <div className="h-10 w-[90%] rounded-xl bg-black/10" />
          <div className="h-4 w-44 rounded-xl bg-black/10" />
          <div className="h-24 w-full rounded-2xl bg-black/10" />
          <div className="h-44 w-full rounded-2xl bg-black/10" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-dvh bg-white px-5 py-8 space-y-4">
        <h1 className="text-xl font-semibold">No pudimos cargar tu cita</h1>
        <p className="text-sm text-muted-foreground">{error ?? "Error"}</p>

        <Button variant="outline" onClick={() => router.push(`/book/${slug}`)}>
          Volver
        </Button>
      </div>
    );
  }

  /* =====================
     UI
  ===================== */

  return (
    <motion.div
      className="min-h-dvh bg-white"
      variants={pageStagger}
      initial="hidden"
      animate="show"
    >
      {/* HERO */}
      <motion.div
        variants={fadeIn}
        className="relative h-[280px] w-full overflow-hidden bg-gray-200"
      >
        {booking.branch?.imageUrl ? (
          <img
            src={booking.branch.imageUrl}
            alt={booking.branch?.name ?? "Sucursal"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gray-200" />
        )}

        {/* overlay (más iOS / más legible) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/60" />

        {/* back */}
        <motion.button
          variants={fadeUp}
          onClick={() => router.back()}
          className={cn(
            "absolute left-4 top-4 z-10 h-10 w-10 rounded-full",
            "bg-white/80 backdrop-blur-md border border-white/40 shadow-sm",
            "flex items-center justify-center"
          )}
        >
          <ArrowLeft className="h-5 w-5 text-black" />
        </motion.button>

        {/* title */}
        <motion.div
          variants={fadeUp}
          className="absolute left-5 bottom-5 z-10 right-5"
        >
          <h1 className="text-white text-[34px] font-semibold leading-[1.05] drop-shadow-sm truncate">
            {booking.branch?.name ?? "Sucursal"}
          </h1>
        </motion.div>
      </motion.div>

      {/* CONTENT */}
      <div className="px-5 pt-5 pb-10">
        {/* pill status */}
        <motion.div
          variants={fadeUp}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
            <Check className="h-3.5 w-3.5 text-white" />
          </span>
          Confirmada
        </motion.div>

        {/* date big */}
        <motion.div variants={fadeUp} className="mt-4">
          <p className="text-[28px] font-semibold leading-tight tracking-tight">
            {headerDateLabel || "—"}
          </p>

          {durationLabel ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {durationLabel}
            </p>
          ) : null}
        </motion.div>

        {/* ACTIONS LIST (card) */}
        <motion.div
          variants={fadeUp}
          className="mt-6 rounded-3xl border border-black/10 bg-white overflow-hidden"
        >
          <ActionRow
            icon={<CalendarDays className="h-5 w-5 text-indigo-600" />}
            title="Añadir al calendario"
            subtitle="Configura un recordatorio"
            onClick={() => console.log("ADD TO CALENDAR", booking.id)}
          />

          <Divider />

          <ActionRow
            icon={<MapPin className="h-5 w-5 text-indigo-600" />}
            title="Cómo llegar"
            subtitle={booking.branch?.address ?? "—"}
            onClick={() => console.log("OPEN MAPS", booking.branch?.address)}
          />

          <Divider />

          <ActionRow
            icon={<RotateCcw className="h-5 w-5 text-indigo-600" />}
            title="Gestionar cita"
            subtitle="Reprograma o cancela tu cita"
            onClick={() => console.log("MANAGE BOOKING", booking.id)}
          />

          <Divider />

          <ActionRow
            icon={<Store className="h-5 w-5 text-indigo-600" />}
            title="Información del establecimiento"
            subtitle={booking.branch?.name ?? "Sucursal"}
            onClick={() => router.push(`/explore`)}
          />
        </motion.div>

        {/* RESUMEN */}
        <motion.div variants={fadeUp} className="mt-8">
          <p className="text-xl font-semibold tracking-tight">Resumen</p>

          <div className="mt-4 rounded-3xl border border-black/10 bg-white p-5 space-y-4">
            {booking.appointments?.map((a: any) => (
              <div
                key={a.id}
                className="flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {a.service?.name ?? "Servicio"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.durationMin ? `${a.durationMin} min` : ""}
                  </p>
                </div>

                <div className="shrink-0 text-sm font-semibold">
                  {a.priceCents ? formatMoneyMXN(a.priceCents) : "0 MXN"}
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-black/10 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-lg font-semibold tracking-tight">
                {booking.totalCents
                  ? formatMoneyMXN(booking.totalCents)
                  : "0 MXN"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* OPTIONAL: ID */}
        <motion.div
          variants={fadeUp}
          className="mt-6 text-xs text-muted-foreground"
        >
          ID de reservación:{" "}
          <span className="font-mono text-black break-all">{booking.id}</span>
        </motion.div>

        {/* CTA */}
        <motion.div variants={fadeUp} className="mt-8">
          <Button
            className="w-full rounded-full py-6"
            onClick={() => router.push(`/book/${slug}`)}
            variant={"primary"}
          >
            Volver a reservar
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* =====================
   UI PARTS
===================== */

function Divider() {
  return <div className="ml-16 h-px bg-black/10" />;
}

function ActionRow({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full px-5 py-4 flex items-center gap-4 text-left",
        "active:bg-black/[0.02]"
      )}
    >
      <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{title}</p>
        <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
      </div>

      <ChevronRight className="h-5 w-5 text-black/30 shrink-0" />
    </button>
  );
}
