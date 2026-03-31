"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePublicBooking } from "@/context/PublicBookingContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock } from "lucide-react";
import {
  createPublicBooking,
  type CreatePublicBookingPayload,
} from "@/lib/services/public/appointment";
import { PublicApiError } from "@/lib/errors";
import { PublicPhoneDialog } from "../public/PublicPhoneDialog";
import { PublicAuthDialog } from "../public/PublicAuthDialog";

import { BookingConfirmSplashDesktop } from "./BookingConfirmSplashDesktop";

const STEP_ROUTES = ["services", "staff", "datetime", "confirm"] as const;

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

export function BookingRightSummary({
  onContinue,
}: {
  onContinue: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const booking = usePublicBooking();

  const {
    selectedGiftCardId,
    giftCardAmountCents,
    selectedCouponId,
    benefits,
  } = booking as any;

  const selectedGiftCard = benefits?.giftCards?.find(
    (g: any) => g.id === selectedGiftCardId,
  );

  const {
    branch,
    services: selectedServices,
    catalog,
    loading,
    canContinue,
    date,
    appointmentsDraft,
    staffCatalog,

    paymentMethod,
    discountCode,
    notes,
  } = booking as any;

  const isConfirmStep = pathname.endsWith("/confirm");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ✅ SPLASH STATE
  const [showSplash, setShowSplash] = useState(false);

  /* =====================
     SERVICES SELECTED (normal summary)
  ===================== */
  const selectedRows = useMemo(() => {
    if (!catalog.length) return [];

    return selectedServices
      .map((id) => catalog.find((s) => s.id === id))
      .filter(Boolean);
  }, [selectedServices, catalog]);

  const totalCentsSimple = useMemo(() => {
    return selectedRows.reduce((acc, s) => acc + (s?.priceCents ?? 0), 0);
  }, [selectedRows]);

  const formattedTotalSimple =
    totalCentsSimple > 0 ? formatMoneyMXN(totalCentsSimple) : "$0 MXN";

  /* =====================
     CONFIRM SUMMARY
  ===================== */
  const confirmTotalCents = useMemo(() => {
    return appointmentsDraft.reduce((acc, a) => {
      const srv = catalog.find((s) => s.id === a.serviceId);
      return acc + (srv?.priceCents ?? 0);
    }, 0);
  }, [appointmentsDraft, catalog]);

  const confirmTimeRange = useMemo(() => {
    if (!appointmentsDraft.length) return null;

    const first = appointmentsDraft[0];
    const last = appointmentsDraft[appointmentsDraft.length - 1];

    return {
      start: formatHourLabel(first.startIso),
      end: formatHourLabel(last.endIso),
    };
  }, [appointmentsDraft]);

  const staffSummary = useMemo(() => {
    const uniqueStaffIds = Array.from(
      new Set(appointmentsDraft.map((a) => a.staffId)),
    );

    return uniqueStaffIds.map((staffId) => {
      const staff = staffCatalog.find((s) => s.id === staffId);
      return {
        id: staffId,
        name: staff?.name ?? staffId,
        avatarUrl: staff?.avatarUrl,
      };
    });
  }, [appointmentsDraft, staffCatalog]);

  const subtotalCents = confirmTotalCents;

  const selectedCoupon = benefits?.coupons?.find(
    (c: any) => c.id === selectedCouponId,
  );

  const couponDiscount = useMemo(() => {
    if (!selectedCoupon) return 0;

    if (selectedCoupon.type === "percentage") {
      return Math.floor(subtotalCents * (selectedCoupon.value / 100));
    }

    return selectedCoupon.value;
  }, [selectedCoupon, subtotalCents]);

  const afterCoupon = Math.max(subtotalCents - couponDiscount, 0);

  const giftCardUsed = Math.min(
    selectedGiftCard?.balanceCents ?? 0,
    afterCoupon,
  );

  const finalTotal = Math.max(afterCoupon - giftCardUsed, 0);

  const canConfirm = Boolean(branch && date && appointmentsDraft.length > 0);

  const [openAuth, setOpenAuth] = useState(false);
  const [openPhone, setOpenPhone] = useState(false);

  const [pendingConfirm, setPendingConfirm] = useState(false);

  async function handleConfirm() {
    if (!canConfirm) return;
    if (submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    // ✅ SPLASH MIN 1.5s
    const splashStart = Date.now();
    setShowSplash(true);

    try {
      const appointments = [...appointmentsDraft].sort((a, b) =>
        a.startIso.localeCompare(b.startIso),
      );

      const subtotal = appointmentsDraft.reduce((acc, a) => {
        const srv = catalog.find((s) => s.id === a.serviceId);
        return acc + (srv?.priceCents ?? 0);
      }, 0);

      const selectedCoupon = benefits?.coupons?.find(
        (c: any) => c.id === selectedCouponId,
      );

      const couponDiscount = selectedCoupon
        ? selectedCoupon.type === "percentage"
          ? Math.floor(subtotal * (selectedCoupon.value / 100))
          : selectedCoupon.value
        : 0;

      const afterCoupon = Math.max(subtotal - couponDiscount, 0);

      const giftCardUsed = Math.min(
        selectedGiftCard?.balanceCents ?? 0,
        afterCoupon,
      );

      const payload: CreatePublicBookingPayload = {
        branchSlug: branch!.slug,
        date: date!,
        paymentMethod: (paymentMethod ?? "ONSITE") as "ONSITE" | "ONLINE",
        discountCode: discountCode?.trim() ? discountCode.trim() : null,
        notes: notes?.trim() ? notes.trim() : null,
        giftCardCode: selectedGiftCard?.code ?? '',
        giftCardAmountCents: giftCardUsed,
        appointments,
      };

      console.log(payload);

      const res = await createPublicBooking(payload);

      // ✅ mínimo 1500ms visible
      const elapsed = Date.now() - splashStart;
      const remaining = Math.max(0, 1500 - elapsed);
      if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));

      router.push(`/me/bookings/${res.bookingId}`);
    } catch (err: any) {
      // 🔥 modales: cerrar splash para que se vean
      if (err instanceof PublicApiError) {
        if (err.code === "UNAUTHORIZED") {
          setShowSplash(false);
          setPendingConfirm(true);
          setOpenAuth(true);
          return;
        }

        if (err.code === "PHONE_REQUIRED") {
          setShowSplash(false);
          setPendingConfirm(true);
          setOpenPhone(true);
          return;
        }
      }

      setSubmitError(err?.message ?? "No se pudo confirmar la reservación");
      setShowSplash(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* ✅ SPLASH: Desktop */}
      <div className="hidden md:block">
        <BookingConfirmSplashDesktop
          open={showSplash}
          title="Cita confirmada"
        />
      </div>

      <div className="sticky top-28 space-y-4">
        <div className="rounded-2xl border bg-white p-5 space-y-5">
          {/* BRANCH */}
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
              {branch?.images?.length ? (
                <img
                  src={
                    branch.images.find((i: any) => i.isCover)?.url ??
                    branch.images[0].url
                  }
                  alt={branch.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  Sin imagen
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="font-semibold truncate">{branch?.name ?? "—"}</p>
              <p className="text-sm text-muted-foreground truncate">
                {branch?.address ?? ""}
              </p>
            </div>
          </div>

          {/* ================= NORMAL SUMMARY ================= */}
          {!isConfirmStep && (
            <>
              <div className="h-px bg-border" />

              <div className="space-y-3 text-sm">
                {!selectedServices.length && (
                  <p className="text-muted-foreground">
                    Selecciona uno o más servicios
                  </p>
                )}

                {selectedRows.map((s) => (
                  <div
                    key={s!.id}
                    className="flex justify-between items-start gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{s!.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s!.durationMin} min
                      </p>
                    </div>

                    <span className="font-medium whitespace-nowrap">
                      ${Math.round((s!.priceCents ?? 0) / 100)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 flex justify-between font-medium">
                <span>Total</span>
                <span>{formattedTotalSimple}</span>
              </div>

              {loading && (
                <p className="text-xs text-muted-foreground">
                  Cargando catálogo…
                </p>
              )}
            </>
          )}

          {/* ================= CONFIRM SUMMARY ================= */}
          {isConfirmStep && (
            <>
              <div className="h-px bg-border" />

              {/* DATE + TIME */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="w-4 h-4" />
                  <span className="capitalize font-light">
                    {date ? formatDateLabel(date) : "—"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="font-light">
                    {confirmTimeRange?.start ?? "—"} –{" "}
                    {confirmTimeRange?.end ?? "—"}
                  </span>
                </div>
              </div>

              {/* STAFF */}
              {staffSummary.length > 0 && (
                <div className="pt-1">
                  <p className="text-xs text-muted-foreground mb-2 font-light">
                    Profesional(es)
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {staffSummary.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center gap-2 px-3 py-1 rounded-full border bg-gray-50"
                      >
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200">
                          {st.avatarUrl ? (
                            <img
                              src={st.avatarUrl}
                              alt={st.name}
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                        </div>
                        <span className="text-xs font-medium">{st.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SERVICES */}
              <div className="space-y-3">
                {appointmentsDraft.map((a) => {
                  const srv = catalog.find((s) => s.id === a.serviceId);
                  const staff = staffCatalog.find((s) => s.id === a.staffId);

                  return (
                    <div
                      key={`${a.serviceId}-${a.startIso}`}
                      className="flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {srv?.name ?? "Servicio"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.durationMin} min
                          {staff?.name ? ` · ${staff.name}` : ""}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-medium">
                          {srv?.priceCents
                            ? formatMoneyMXN(srv.priceCents)
                            : "$0 MXN"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatHourLabel(a.startIso)} –{" "}
                          {formatHourLabel(a.endIso)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* TOTAL */}
              <div className="border-t pt-4 space-y-2 text-sm">
                {/* SUBTOTAL */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatMoneyMXN(subtotalCents)}</span>
                </div>

                {/* COUPON */}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento</span>
                    <span>- {formatMoneyMXN(couponDiscount)}</span>
                  </div>
                )}

                {/* GIFT CARD */}
                {giftCardUsed > 0 && (
                  <div className="flex justify-between text-indigo-600">
                    <span>Gift card</span>
                    <span>- {formatMoneyMXN(giftCardUsed)}</span>
                  </div>
                )}

                {/* TOTAL FINAL */}
                <div className="flex justify-between pt-2 border-t mt-2">
                  <span className="font-medium">Total</span>
                  <span className="text-lg font-semibold">
                    {formatMoneyMXN(finalTotal)}
                  </span>
                </div>
              </div>

              {/* ERROR */}
              {submitError && (
                <p className="text-sm text-red-600">{submitError}</p>
              )}

              {/* CTA CONFIRM */}
              <Button
                className={cn(
                  "w-full h-12 rounded-full",
                  "bg-black hover:bg-black/90",
                )}
                disabled={!canConfirm || submitting}
                onClick={handleConfirm}
              >
                {submitting ? "Confirmando..." : "Confirmar"}
              </Button>
            </>
          )}
        </div>

        {isConfirmStep && (
          <p className="text-xs text-muted-foreground">
            Al confirmar aceptas la política de cancelación del establecimiento.
          </p>
        )}

        <PublicAuthDialog
          open={openAuth}
          onOpenChange={setOpenAuth}
          onLoggedIn={() => {
            setOpenAuth(false);

            if (pendingConfirm) {
              setPendingConfirm(false);
              handleConfirm(); // 🔥 reintenta solo
            }
          }}
        />

        <PublicPhoneDialog
          open={openPhone}
          onOpenChange={setOpenPhone}
          onSaved={() => {
            setOpenPhone(false);

            if (pendingConfirm) {
              setPendingConfirm(false);
              handleConfirm(); // 🔥 reintenta solo
            }
          }}
        />
      </div>
    </>
  );
}
