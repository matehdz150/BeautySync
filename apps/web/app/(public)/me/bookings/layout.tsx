"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  History,
  Search,
  Loader2,
  ArrowLeft,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

import { getMyPublicAppointments } from "@/lib/services/public/me/appointments";
import { motion } from "framer-motion";
import BookingDetailPage from "./[bookingId]/page";
import { RatingPanel } from "@/components/public/me/booking/rating/RatingPanel";
import { BookingDesktopLayout } from "@/components/public/me/booking/BookingDesktopLayout";
import BookingReschedulePage from "./[bookingId]/reschedule/page";
import BookingRatePage from "./[bookingId]/rate/page";

type BookingStatus =
  | "CONFIRMED"
  | "PENDING"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

type Booking = {
  key: string;
  id: string;
  status: BookingStatus;
  branchName: string;
  startsAtISO: string;
  endsAtISO: string;
  priceMXN?: number;
  itemsCount?: number;
  coverUrl?: string | null;
};

function formatDateTime(iso: string) {
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

function moneyMXN(value?: number) {
  if (typeof value !== "number") return null;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function mapApiItemToBooking(x: any): Booking {
  const id = String(x.bookingId ?? x.id ?? "unknown");

  return {
    key: `${id}-${x.startsAtISO ?? "no-date"}`,
    id,
    status: x.status as BookingStatus,

    branchName: x.branch?.name ?? "Sucursal",
    startsAtISO: x.startsAtISO,
    endsAtISO: x.endsAtISO,

    priceMXN:
      typeof x.totalPriceCents !== "undefined"
        ? Number(x.totalPriceCents) / 100
        : undefined,

    itemsCount: Number(x.itemsCount ?? 1),
    coverUrl: x.branch?.coverUrl ?? null,
  };
}

export default function BookingsLayout({
  children,
  rate,
}: {
  children: React.ReactNode;
  rate: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();

  const activeId = useMemo(() => {
    const m = pathname.match(/\/me\/bookings\/([^/]+)/);
    return m?.[1] ?? null;
  }, [pathname]);

  const isDetailRoute = !!activeId;

  const [tab, setTab] = useState<"UPCOMING" | "PAST">("UPCOMING");

  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // counts (solo para UI, no real total)
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [pastCount, setPastCount] = useState(0);

  const isRateRoute = /\/me\/bookings\/[^/]+\/rate$/.test(pathname);
  const isReschedule = /\/reschedule$/.test(pathname);
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErrorMsg(null);

      try {
        const res = await getMyPublicAppointments({ tab, limit: 20 });

        if (!alive) return;

        setItems(
          res.items.map(mapApiItemToBooking).filter((x) => Boolean(x.id))
        );

        // counts rápidos
        const [up, past] = await Promise.all([
          getMyPublicAppointments({ tab: "UPCOMING", limit: 20 }),
          getMyPublicAppointments({ tab: "PAST", limit: 20 }),
        ]);

        if (!alive) return;

        setUpcomingCount(up.items.length);
        setPastCount(past.items.length);
      } catch (err: any) {
        if (!alive) return;
        setErrorMsg(err?.message ?? "Error cargando citas");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    void load();

    return () => {
      alive = false;
    };
  }, [tab]);

  if (isMobile === null) return <div>{children}</div>;

  /**
   * ✅ MOBILE LAYOUT
   * - /me/bookings => lista
   * - /me/bookings/:id => detalle
   */
  if (isMobile) {
    // DETAIL
    if (isDetailRoute) {
      return (
        <div className="min-h-screen bg-transparent">
          <div className="sticky top-0 z-20 border-b border-black/5 bg-transparent backdrop-blur">
            <div className="flex items-center gap-2 px-4 py-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => router.push("/me/bookings")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold tracking-tight">Cita</p>
                <p className="text-xs text-black/50 truncate">
                  Detalle de tu reservación
                </p>
              </div>
            </div>
          </div>

          <div className="px-3 pb-6 pt-3">
            <div className="overflow-hidden rounded-[28px] border border-black/5 bg-transparent shadow-sm">
              {children}
            </div>
          </div>
        </div>
      );
    }

    // LIST
    return (
      <div className="min-h-screen bg-transparent">
        <div className="px-4 pt-5">
          <p className="text-2xl font-semibold tracking-tight">Citas</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Administra tus reservaciones
          </p>
        </div>

        <div className="mt-4 px-4">
          <SegmentedToggle
            value={tab}
            onChange={setTab}
            upcomingCount={upcomingCount}
            pastCount={pastCount}
          />
        </div>

        <div className="mt-4 px-3 pb-8">
          {loading ? (
            <div className="rounded-[26px] border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 text-sm text-black/60">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando citas…
              </div>
            </div>
          ) : errorMsg ? (
            <div className="rounded-[26px] border border-black/5 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold">Error</p>
              <p className="mt-1 text-sm text-muted-foreground">{errorMsg}</p>
            </div>
          ) : items.length === 0 ? (
            tab === "UPCOMING" ? (
              <EmptyState
                title="No hay próximas citas"
                description="Tus próximas citas aparecerán aquí cuando reserves."
                ctaLabel="Buscar salones"
                ctaHref="/explore"
              />
            ) : (
              <div className="rounded-[26px] border border-black/5 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold">Aún no tienes historial</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cuando completes tus primeras citas, aparecerán aquí.
                </p>
              </div>
            )
          ) : (
            <div className="space-y-3">
              {items.map((b) => (
                <BookingRowMobile key={b.key} booking={b} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <BookingDesktopLayout
      list={
        <div className="min-w-0 rounded-[28px] border border-black/5 bg-white p-4">
          <div className="px-2 pb-3">
            <p className="text-lg font-semibold tracking-tight">Citas</p>
            <p className="text-sm text-muted-foreground">
              Administra tus reservaciones
            </p>
          </div>

          <div className="px-2 pb-4">
            <SegmentedToggle
              value={tab}
              onChange={setTab}
              upcomingCount={upcomingCount}
              pastCount={pastCount}
            />
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="rounded-[26px] border border-black/5 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 text-sm text-black/60">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando citas…
                </div>
              </div>
            ) : errorMsg ? (
              <div className="rounded-[26px] border border-black/5 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold">Error</p>
                <p className="mt-1 text-sm text-muted-foreground">{errorMsg}</p>
              </div>
            ) : items.length === 0 ? (
              tab === "UPCOMING" ? (
                <EmptyState
                  title="No hay próximas citas"
                  description="Tus próximas citas aparecerán aquí cuando reserves."
                  ctaLabel="Buscar salones"
                  ctaHref="/explore"
                />
              ) : (
                <div className="rounded-[26px] border border-black/5 bg-white p-6 shadow-sm">
                  <p className="text-sm font-semibold">
                    Aún no tienes historial
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Cuando completes tus primeras citas, aparecerán aquí.
                  </p>
                </div>
              )
            ) : (
              items.map((b) => (
                <BookingRowDesktop
                  key={b.key}
                  booking={b}
                  active={b.id === activeId}
                />
              ))
            )}
          </div>
        </div>
      }
      detail={<BookingDetailPage/>}
      side={
    isRateRoute ? (
      <BookingRatePage />
    ) : isReschedule ? (
      <BookingReschedulePage />
    ) : null
  }
    />
  );
}

function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="rounded-[26px] border border-black/5 bg-white p-6 shadow-sm ">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50">
          <CalendarDays className="h-6 w-6 text-indigo-600" />
        </div>

        <p className="mt-4 text-lg font-semibold tracking-tight">{title}</p>

        <p className="mt-1 max-w-[280px] text-sm text-muted-foreground">
          {description}
        </p>

        <Button asChild className="mt-5 rounded-full px-6">
          <Link href={ctaHref}>
            <Search className="mr-2 h-4 w-4" />
            {ctaLabel}
          </Link>
        </Button>
      </div>
    </div>
  );
}

/** ✅ Mobile row: más grande, más táctil, mejor spacing */
function BookingRowMobile({ booking }: { booking: Booking }) {
  return (
    <Link
      href={`/me/bookings/${booking.id}`}
      className={cn(
        "group block overflow-hidden rounded-2xl border border-black/5 bg-white",
        "active:scale-[0.99] transition"
      )}
    >
      <div className="flex gap-3">
        <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden bg-black/[0.02]">
          {booking.coverUrl ? (
            <Image
              src={booking.coverUrl}
              alt={booking.branchName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black/[0.03]">
                <History className="h-5 w-5 text-black/60" />
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 py-3 pr-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight">
                {booking.branchName}
              </p>
              <p className="truncate text-sm text-black/60">
                {formatDateTime(booking.startsAtISO)}
              </p>
            </div>

            <ChevronRight className="mt-1 h-4 w-4 text-black/25" />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-black/50">
            {typeof booking.priceMXN === "number" ? (
              <span className="font-medium text-black/70">
                {moneyMXN(booking.priceMXN)}
              </span>
            ) : null}

            {typeof booking.itemsCount === "number" ? (
              <>
                <span className="text-black/20">•</span>
                <span>{booking.itemsCount} servicio(s)</span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Desktop row (tu diseño) */
function BookingRowDesktop({
  booking,
  active,
}: {
  booking: Booking;
  active: boolean;
}) {
  const href =
  booking.status === "COMPLETED"
    ? `/me/bookings/${booking.id}/rate`
    : `/me/bookings/${booking.id}`;

  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-sm border bg-white transition",
        "duration-200 ease-out",
        active
          ? "border-black/15 bg-black/[0.02]"
          : "border-black/5 hover:border-black/10 hover:bg-black/[0.01]"
      )}
    >
      
      <div className="flex gap-3">
        <div className="relative h-[86px] w-[108px] shrink-0 overflow-hidden rounded-l-sm border-r border-black/5 bg-black/[0.02]">
          {booking.coverUrl ? (
            <Image
              src={booking.coverUrl}
              alt={booking.branchName}
              fill
              className={cn(
                "object-cover transition duration-300",
                "group-hover:scale-[1.02]"
              )}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black/[0.03]">
                <History className="h-5 w-5 text-black/60" />
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 py-3 pr-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight">
                {booking.branchName}
              </p>
              <p className="truncate text-sm text-black/60">
                {formatDateTime(booking.startsAtISO)}
              </p>
            </div>

            <ChevronRight
              className={cn(
                "mt-1 h-4 w-4 transition duration-200",
                active
                  ? "text-black/60"
                  : "text-black/25 group-hover:translate-x-[1px] group-hover:text-black/50"
              )}
            />
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs text-black/50">
            {typeof booking.priceMXN === "number" ? (
              <span className="font-medium text-black/60">
                {moneyMXN(booking.priceMXN)}
              </span>
            ) : null}

            {typeof booking.itemsCount === "number" ? (
              <>
                <span className="text-black/20">•</span>
                <span>{booking.itemsCount} servicio(s)</span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

function SegmentedToggle({
  value,
  onChange,
  upcomingCount,
  pastCount,
}: {
  value: "UPCOMING" | "PAST";
  onChange: (v: "UPCOMING" | "PAST") => void;
  upcomingCount: number;
  pastCount: number;
}) {
  return (
    <div className="rounded-full bg-white p-1 border border-black/10">
      <div className="relative grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => onChange("UPCOMING")}
          className={cn(
            "relative h-9 rounded-full px-2 text-sm font-medium transition",
            value === "UPCOMING"
              ? "text-white"
              : "text-black/60 hover:text-black"
          )}
        >
          {/* PILL ANIMADO */}
          {value === "UPCOMING" && (
            <motion.span
              layoutId="segmented-pill"
              className="absolute inset-0 rounded-full bg-black"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}

          <span className="relative z-10">
            Próximas{" "}
            <span
              className={cn(
                "ml-1 text-xs",
                value === "UPCOMING" ? "text-white/70" : "text-black/40"
              )}
            >
              ({upcomingCount})
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChange("PAST")}
          className={cn(
            "relative h-9 rounded-full px-2 text-sm font-medium transition",
            value === "PAST" ? "text-white" : "text-black/60 hover:text-black"
          )}
        >
          {/* PILL ANIMADO */}
          {value === "PAST" && (
            <motion.span
              layoutId="segmented-pill"
              className="absolute inset-0 rounded-full bg-black"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}

          <span className="relative z-10">
            Pasadas{" "}
            <span
              className={cn(
                "ml-1 text-xs",
                value === "PAST" ? "text-white/70" : "text-black/40"
              )}
            >
              ({pastCount})
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
