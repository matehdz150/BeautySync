"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  XCircle,
  AlertCircle,
  Sparkles,
  Store,
  ShoppingCart,
  X,
  Loader2,
  MapPin,
  CreditCard,
  StickyNote,
  CircleCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { getMyPublicBookingById } from "@/lib/services/public/me/appointments";

type BookingStatus =
  | "CONFIRMED"
  | "PENDING"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

type BookingDetailApiResponse = {
  ok: boolean;
  booking: {
    id: string;

    branch: {
      id: string;
      name: string;
      slug: string;
      coverUrl: string | null;
      address?: string;
    };

    date: string;
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

      service: { id: string; name: string };
      staff: { id: string; name: string; avatarUrl: string | null };
    }>;
  };
};

type BookingDetailVM = {
  bookingId: string;
  status: BookingStatus;

  startsAtISO: string;
  endsAtISO: string;

  itemsCount: number;
  totalPriceCents: number;

  paymentMethod: "ONLINE" | "ONSITE";
  notes: string | null;

  branch: {
    id: string;
    name: string;
    slug: string;
    coverUrl: string | null;
    address?: string;
  };

  appointments: Array<{
    id: string;
    status: BookingStatus;
    startIso: string;
    endIso: string;
    durationMin: number;
    priceCents: number;
    serviceName: string;
    staffName: string;
    staffAvatarUrl: string | null;
  }>;
};

function formatBigDate(iso: string) {
  const d = new Date(iso);

  const date = d.toLocaleDateString("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const time = d.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${date} a las ${time}`;
}

function moneyMXNFromCents(cents: number) {
  const value = cents / 100;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function statusBadge(status: BookingStatus) {
  switch (status) {
    case "CONFIRMED":
      return {
        label: "Confirmado",
        className: "bg-emerald-600 text-white",
        icon: <CircleCheck className="h-4 w-4" />,
      };
    case "PENDING":
      return {
        label: "Pendiente",
        className: "bg-amber-500 text-white",
        icon: <AlertCircle className="h-4 w-4" />,
      };
    case "CANCELLED":
      return {
        label: "Cancelado",
        className: "bg-red-600 text-white",
        icon: <XCircle className="h-4 w-4" />,
      };
    case "COMPLETED":
      return {
        label: "Completado",
        className: "bg-indigo-600 text-white",
        icon: <Sparkles className="h-4 w-4" />,
      };
    case "NO_SHOW":
      return {
        label: "No asistió",
        className: "bg-zinc-800 text-white",
        icon: <XCircle className="h-4 w-4" />,
      };
  }
}

function durationLabel(startsAtISO: string, endsAtISO: string) {
  const start = new Date(startsAtISO).getTime();
  const end = new Date(endsAtISO).getTime();
  const mins = Math.max(0, Math.round((end - start) / 60000));

  if (!Number.isFinite(mins) || mins <= 0) return "Duración por confirmar";
  if (mins < 60) return `${mins} min de duración`;

  const hours = Math.floor(mins / 60);
  const rest = mins % 60;

  if (rest === 0) return `${hours} hora${hours === 1 ? "" : "s"} de duración`;
  return `${hours}h ${rest}min de duración`;
}

function ActionRow({
  icon,
  title,
  subtitle,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-4 rounded-2xl px-2 py-3 transition",
        "hover:bg-black/[0.03] active:scale-[0.99]"
      )}
    >
      <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[15px] sm:text-base font-semibold tracking-tight">
          {title}
        </p>
        <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
      </div>
    </Link>
  );
}

function mapApiToVM(res: BookingDetailApiResponse): BookingDetailVM {
  const b = res?.booking;

  if (!b?.id) throw new Error("Respuesta inválida: booking no encontrado");

  const appointments = Array.isArray(b.appointments) ? b.appointments : [];
  const sorted = [...appointments].sort(
    (a, z) => new Date(a.startIso).getTime() - new Date(z.startIso).getTime()
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const statusPriority = (s: BookingStatus) => {
    if (s === "CONFIRMED") return 5;
    if (s === "PENDING") return 4;
    if (s === "COMPLETED") return 3;
    if (s === "NO_SHOW") return 2;
    if (s === "CANCELLED") return 1;
    return 0;
  };

  const status =
    sorted
      .map((x) => x.status)
      .sort((a, z) => statusPriority(z) - statusPriority(a))[0] ?? "PENDING";

  return {
    bookingId: b.id,
    status,

    startsAtISO: first?.startIso ?? new Date().toISOString(),
    endsAtISO: last?.endIso ?? new Date().toISOString(),

    itemsCount: sorted.length || 1,
    totalPriceCents: Number(b.totalCents ?? 0),

    paymentMethod: b.paymentMethod ?? "ONSITE",
    notes: b.notes ?? null,

    branch: {
      id: b.branch?.id ?? "unknown",
      name: b.branch?.name ?? "Sucursal",
      slug: b.branch?.slug ?? "",
      coverUrl: b.branch?.coverUrl ?? null,
      address: b.branch?.address,
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

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams<{ bookingId: string }>();
  const bookingId = params?.bookingId;

  const [booking, setBooking] = useState<BookingDetailVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!bookingId) return;

      setLoading(true);
      setErrorMsg(null);

      try {
        const res = (await getMyPublicBookingById(
          bookingId
        )) as unknown as BookingDetailApiResponse;

        if (!alive) return;

        setBooking(mapApiToVM(res));
      } catch (err: any) {
        if (!alive) return;
        setErrorMsg(err?.message ?? "Error cargando la reservación");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    void load();

    return () => {
      alive = false;
    };
  }, [bookingId]);

  const badge = useMemo(() => {
    return statusBadge(booking?.status ?? "PENDING");
  }, [booking?.status]);

  function handleClose() {
    router.push("/me/bookings");
  }

  if (loading) {
    return (
      <div className="w-full rounded-[28px] border border-black/5 bg-white p-6 sm:p-10">
        <div className="flex items-center gap-3 text-sm text-black/60">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando reservación…
        </div>
      </div>
    );
  }

  if (errorMsg || !booking) {
    return (
      <div className="w-full rounded-[28px] border border-black/5 bg-white p-6 sm:p-10">
        <p className="text-sm font-semibold">No se pudo cargar</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {errorMsg ?? "Booking no encontrado"}
        </p>

        <Button className="mt-5 rounded-full" onClick={handleClose}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <>
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

      <div className="w-full" key={booking.bookingId}>
        {/* Cover */}
        <div
          className={cn(
            "relative w-full overflow-hidden bg-black/[0.02]",
            "h-[170px] sm:h-[240px] lg:h-[280px]"
          )}
          style={{ animation: "bsCoverIn 260ms ease-out both" }}
        >
          {booking.branch.coverUrl ? (
            <>
              <Image
                src={booking.branch.coverUrl}
                alt={booking.branch.name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          )}

          {/* Close */}
          <div className="absolute right-3 top-3 z-10 sm:right-5 sm:top-5">
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleClose}
              className={cn(
                "h-10 w-10 rounded-full border border-white/25 bg-white/15 text-white",
                "backdrop-blur-md shadow-sm",
                "hover:bg-white/20 active:scale-[0.98]"
              )}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6">
            <h1 className="text-[22px] leading-tight font-semibold tracking-tight text-white drop-shadow sm:text-3xl lg:text-4xl">
              {booking.branch.name}
            </h1>
          </div>
        </div>

        {/* Body */}
        <div
          className={cn("p-4 sm:p-6 lg:p-8")}
          style={{ animation: "bsFadeUp 280ms ease-out both" }}
        >
          {/* Badge */}
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
              badge.className
            )}
            style={{ animation: "bsSoftPop 240ms ease-out both" }}
          >
            {badge.icon}
            {badge.label}
          </div>

          {/* Date */}
          <h2 className="mt-4 text-[22px] leading-tight font-semibold tracking-tight text-black sm:mt-6 sm:text-3xl lg:text-4xl">
            {formatBigDate(booking.startsAtISO)}
          </h2>

          <p className="mt-2 text-sm text-black/50 sm:text-base">
            {durationLabel(booking.startsAtISO, booking.endsAtISO)}
          </p>

          {/* Actions */}
          <div className="mt-6 space-y-1 sm:mt-8">
            <ActionRow
              icon={<ShoppingCart className="h-5 w-5" />}
              title="Volver a reservar"
              subtitle="Reserva tu próxima cita"
              href={`/book/${booking.branch.slug}`}
            />

            <div className="my-2 h-px bg-black/10" />

            <ActionRow
              icon={<Store className="h-5 w-5" />}
              title="Información del establecimiento"
              subtitle={booking.branch.address ?? booking.branch.name}
              href={
                booking.branch.slug
                  ? `/explore/${booking.branch.slug}`
                  : "/explore"
              }
            />
          </div>

          {/* Resumen */}
          <div className="mt-6 rounded-2xl border border-black/10 bg-white">
            <div className="p-4 sm:p-6">
              <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-black">
                Resumen
              </h3>

              <div className="mt-5 space-y-5 sm:mt-6 sm:space-y-6">
                {booking.appointments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start justify-between gap-4 sm:gap-6"
                  >
                    <div className="min-w-0">
                      <p className="text-[15px] sm:text-lg font-medium text-black truncate">
                        {a.serviceName}
                      </p>

                      <p className="mt-1 text-xs sm:text-sm text-black/50">
                        {a.durationMin >= 60
                          ? `${Math.floor(a.durationMin / 60)} h`
                          : `${a.durationMin} min`}{" "}
                        • {a.staffName}
                      </p>
                    </div>

                    <div className="shrink-0 text-[15px] sm:text-lg font-medium text-black">
                      {moneyMXNFromCents(a.priceCents)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="my-6 sm:my-8 h-px w-full bg-black/10" />

              <div className="flex items-center justify-between gap-4">
                <p className="text-lg sm:text-xl font-semibold text-black">
                  Total
                </p>

                <p className="text-lg sm:text-xl font-semibold text-black">
                  {moneyMXNFromCents(booking.totalPriceCents)}
                </p>
              </div>

              {/* Ref (uuid largo => wrap + break-all) */}
              <p className="mt-6 sm:mt-8 text-sm sm:text-base text-black/45">
                Ref. de la reserva:{" "}
                <span className="font-medium text-black/60 break-all">
                  {booking.bookingId}
                </span>
              </p>
            </div>
          </div>

          {/* Detalles */}
          <div className="mt-4 space-y-3">
            {booking.branch.address ? (
              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <div className="flex items-center gap-2 text-xs text-black/50">
                  <MapPin className="h-4 w-4" />
                  Dirección
                </div>
                <p className="mt-1 text-sm font-semibold leading-snug text-black">
                  {booking.branch.address}
                </p>
              </div>
            ) : null}

            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex items-center gap-2 text-xs text-black/50">
                <CreditCard className="h-4 w-4" />
                Pago
              </div>
              <p className="mt-1 text-sm font-semibold text-black">
                {booking.paymentMethod === "ONLINE" ? "En línea" : "En sitio"}
              </p>
            </div>

            {booking.notes ? (
              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <div className="flex items-center gap-2 text-xs text-black/50">
                  <StickyNote className="h-4 w-4" />
                  Notas
                </div>
                <p className="mt-1 text-sm font-semibold leading-snug text-black">
                  {booking.notes}
                </p>
              </div>
            ) : null}
          </div>

          <div className="h-3 sm:h-0" />
        </div>
      </div>
    </>
  );
}