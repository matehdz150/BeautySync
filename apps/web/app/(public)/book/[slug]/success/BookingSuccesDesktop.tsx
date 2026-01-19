"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Copy,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPublicBookingById } from "@/lib/services/public/appointment";

/* =====================
   HELPERS
===================== */

function formatDateLabel(dateIso: string) {
  return new Date(dateIso).toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
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
  return `$${Math.round(cents / 100)} MXN`;
}

/* =====================
   ANIMATIONS
===================== */

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

/* =====================
   PAGE
===================== */

export default function BookingSuccessDesktop() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();

  const slug = params.slug;
  const bookingId = searchParams.get("bookingId") ?? "";

  const [copied, setCopied] = useState(false);
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

    const first = booking.appointments[0];
    const last = booking.appointments[booking.appointments.length - 1];

    return {
      start: formatHourLabel(first.startIso),
      end: formatHourLabel(last.endIso),
    };
  }, [booking]);

  async function copyId() {
    if (!bookingId) return;
    try {
      await navigator.clipboard.writeText(bookingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-[80vh] bg-white">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -top-60 h-125 w-255 -translate-x-1/2 z-0 rounded-full blur-3xl
             bg-gradient-to-b from-indigo-400/75 via-indigo-400/10 to-transparent"
        initial={{
          opacity: 0,
          scale: 0.92,
          filter: "blur(90px)",
        }}
        animate={{
          opacity: 1,
          scale: [1, 1.03, 1],
          y: [0, 10, 0],
          filter: ["blur(50px)", "blur(58px)", "blur(50px)"],
        }}
        transition={{
          opacity: { duration: 1.4, ease: "easeOut" },
          scale: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
          y: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
          filter: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
        }}
      />
      <div className="mx-auto w-full max-w-[1200px] px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-start">
          {/* ================= LEFT ================= */}
          <motion.section
            variants={stagger}
            initial="hidden"
            animate="show"
            className="min-w-0"
          >
            {/* micro label */}
            <motion.p
              variants={fadeUp}
              className="text-xs tracking-[0.22em] uppercase text-muted-foreground"
            >
              Confirmación
            </motion.p>

            {/* Title */}
            <motion.h1
              variants={fadeUp}
              className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]"
            >
              Tu reservación
              <br />
              ya está lista
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-xl text-base text-muted-foreground leading-relaxed"
            >
              Guardamos tu espacio y tu tiempo.
              <span className="text-black font-medium">
                {" "}
                Llegas, respiras y disfrutas.
              </span>
            </motion.p>

            {/* CTA */}
            <motion.div variants={fadeUp} className="mt-8 flex gap-3">
              <Button
                className="rounded-full px-6"
                onClick={() => router.push(`/book/${slug}`)}
              >
                Hacer otra reservación
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Button
                variant="outline"
                className="rounded-full px-6"
                onClick={() => router.push(`/explore`)}
              >
                Volver al inicio
              </Button>
            </motion.div>

            {/* Divider */}
            <motion.div
              variants={fadeUp}
              className="mt-10 h-px w-full bg-black/10"
            />

            {/* Booking summary */}
            <motion.div variants={fadeUp} className="mt-8 space-y-5">
              {loading && (
                <div className="rounded-2xl border border-black/10 bg-white p-5">
                  <p className="text-sm font-medium">Cargando tu cita…</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Estamos armando tu resumen.
                  </p>
                </div>
              )}

              {error && !loading && (
                <div className="rounded-2xl border border-black/10 bg-white p-5">
                  <p className="text-sm font-semibold">
                    No pudimos cargar la reservación
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{error}</p>
                </div>
              )}

              {!loading && !error && booking && (
                <>
                  {/* ID block */}
                  <div className="rounded-2xl border border-black/10 bg-white p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          ID de reservación
                        </p>
                        <p className="mt-1 font-mono text-sm break-all">
                          {booking.id}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={copyId}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        {copied ? "Copiado" : "Copiar"}
                      </Button>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmada y guardada en el sistema.
                    </div>
                  </div>

                  {/* chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow
                      icon={<CalendarDays className="w-4 h-4" />}
                      label="Fecha"
                      value={booking.date ? formatDateLabel(booking.date) : "—"}
                    />

                    <InfoRow
                      icon={<Clock className="w-4 h-4" />}
                      label="Hora"
                      value={
                        timeRange
                          ? `${timeRange.start} – ${timeRange.end}`
                          : "—"
                      }
                    />

                    <div className="sm:col-span-2">
                      <InfoRow
                        icon={<MapPin className="w-4 h-4" />}
                        label={booking.branch?.name ?? "Sucursal"}
                        value={booking.branch?.address ?? "—"}
                      />
                    </div>
                  </div>

                  {/* services */}
                  <div className="rounded-2xl border border-black/10 bg-white p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Servicios</p>
                      <span className="text-xs text-muted-foreground">
                        {booking.appointments?.length ?? 0} item(s)
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {booking.appointments.map((a: any) => (
                        <div
                          key={a.id}
                          className="flex items-start justify-between gap-4 border-t border-black/10 pt-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {a.service?.name ?? "Servicio"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {a.staff?.name ? `${a.staff.name} · ` : ""}
                              {a.durationMin} min
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold">
                              {a.priceCents
                                ? formatMoneyMXN(a.priceCents)
                                : "$0 MXN"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatHourLabel(a.startIso)} –{" "}
                              {formatHourLabel(a.endIso)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-4">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-lg font-semibold">
                        {formatMoneyMXN(booking.totalCents)}
                      </p>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      Método de pago:{" "}
                      <span className="text-black font-medium">
                        {booking.paymentMethod === "ONLINE"
                          ? "Pago en línea"
                          : "Pago en el establecimiento"}
                      </span>
                    </p>

                    {booking.notes ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Nota:{" "}
                        <span className="text-black">{booking.notes}</span>
                      </p>
                    ) : null}
                  </div>
                </>
              )}
            </motion.div>
          </motion.section>

          {/* ================= RIGHT ================= */}
          <motion.aside
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="hidden lg:block h-full"
          >
            <div className="h-full rounded-3xl border border-black/10 bg-white p-6 flex flex-col">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold tracking-tight">
                    Momentos, no pendientes.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Un collage editorial para cerrar la reservación.
                  </p>
                </div>

                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Moodboard
                </p>
              </div>

              {/* 👇 ahora el collage crece hasta el fondo del card */}
              <div className="mt-5 relative flex-1 min-h-0">
                {/* 1 - main */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-0 top-0 w-[72%] h-[60%]"
                >
                  <CollageFrame
                    src="https://plus.unsplash.com/premium_photo-1661542840412-fe2bd68f8b2f?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Mood 1"
                    variant="mat"
                  />
                </motion.div>

                {/* 2 - top right */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-6 w-[44%] h-[36%]"
                >
                  <CollageFrame
                    src="https://images.unsplash.com/photo-1627840393103-c08434c7e09f?q=80&w=903&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Mood 2"
                    variant="plain"
                  />
                </motion.div>

                {/* 3 - bottom left wide */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-8 bottom-8 w-[64%] h-[28%]"
                >
                  <CollageFrame
                    src="https://images.unsplash.com/photo-1531299244174-d247dd4e5a66?q=80&w=1029&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Mood 3"
                    variant="plain"
                  />
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-30 bottom-50 w-[64%] h-[28%]"
                >
                  <CollageFrame
                    src="https://images.unsplash.com/photo-1636990490500-2b176437e4a6?q=80&w=2075&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Mood 3"
                    variant="plain"
                  />
                </motion.div>

                {/* 4 - bottom right */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-3 bottom-14 w-[48%] h-[26%]"
                >
                  <CollageFrame
                    src="https://images.unsplash.com/photo-1701976857871-a46363644519?q=80&w=1064&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Mood 4"
                    variant="mat"
                  />
                </motion.div>

                {/* Minimal label */}
                <div className="absolute left-0 bottom-0">
                  <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                    <p className="text-xs font-semibold">
                      Reservación confirmada
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Nos vemos pronto.
                    </p>
                  </div>
                </div>
              </div>

              {/* 👇 este footer se queda pegado abajo */}
              <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
                <span>Editorial</span>
                <span>Clean</span>
                <span>Precise</span>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}

/* =====================
   UI PARTS
===================== */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 flex items-start gap-3">
      <div className="mt-0.5 text-black/70">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function CollageFrame({
  src,
  alt,
  variant = "plain",
}: {
  src: string;
  alt: string;
  variant?: "plain" | "mat";
}) {
  return (
    <div
      className={cn(
        "relative w-full h-full overflow-hidden rounded-3xl border border-black/10 bg-white",
        variant === "mat" ? "p-3" : ""
      )}
    >
      <div
        className={cn(
          "w-full h-full overflow-hidden rounded-[1.25rem] bg-gray-100",
          variant === "mat" ? "border border-black/10" : ""
        )}
      >
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      </div>
    </div>
  );
}