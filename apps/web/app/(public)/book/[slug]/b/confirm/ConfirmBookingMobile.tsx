"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Store,
  Sparkles,
  ChevronRight,
  Gem,
  LucideProps,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePublicBooking } from "@/context/PublicBookingContext";
import { cn } from "@/lib/utils";
import {
  createPublicBooking,
  type CreatePublicBookingPayload,
} from "@/lib/services/public/appointment";
import { BookingConfirmSplash } from "../../success/BookingConfirmSplash";
import { PublicPhoneDialog } from "@/components/public/PublicPhoneDialog";
import { PublicAuthDialog } from "@/components/public/PublicAuthDialog";
import { PublicApiError } from "@/lib/errors";
import { AvailableRewardsMobileDrawer } from "@/components/loyal-program/AvailableRewardsMobileDrawer";
import { BenefitsUnifiedSlider } from "@/components/book/BenefitsUnifiedSlider";
import {
  getPaymentBenefits,
  validatePublicCoupon,
} from "@/lib/services/public/payments";
type PaymentMethod = "ONSITE" | "ONLINE";
type CouponDiagnostic = {
  valid: boolean;
  reason: string;
  discountCents?: number;
};

export function ConfirmBookingMobilePage() {
  const router = useRouter();
  const booking = usePublicBooking();
  const dispatch = booking.dispatch;

  const { branch, date, appointmentsDraft } = booking;

  // ✅ estos 3 deben ser estado local en este componente
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ONSITE");
  const [discountCode, setDiscountCode] = useState("");
  const [notes, setNotes] = useState("");

  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponMessageType, setCouponMessageType] = useState<
    "error" | "success" | null
  >(null);
  const [couponDiagnostics, setCouponDiagnostics] = useState<
    Record<string, CouponDiagnostic>
  >({});

  const [showSplash, setShowSplash] = useState(false);
  const [rewardsSheetOpen, setRewardsSheetOpen] = useState(false);

  const canConfirm = useMemo(() => {
    return Boolean(branch && date && appointmentsDraft?.length > 0);
  }, [branch, date, appointmentsDraft]);
  const subtotalCents = useMemo(() => {
    return booking.services.reduce((acc: number, id: string) => {
      const srv = booking.catalog.find((s) => s.id === id);
      return acc + (srv?.priceCents ?? 0);
    }, 0);
  }, [booking.services, booking.catalog]);
  const couponDiscountCents = Math.min(
    booking.appliedCouponDiscountCents ?? 0,
    subtotalCents,
  );
  const totalAfterCouponCents = Math.max(subtotalCents - couponDiscountCents, 0);
  const selectedGiftCard = booking.benefits.giftCards.find(
    (gc) => gc.id === booking.selectedGiftCardId,
  );
  const giftCardUsedCents = Math.min(
    selectedGiftCard?.balanceCents ?? 0,
    totalAfterCouponCents,
  );
  const totalAfterDiscountCents = Math.max(
    totalAfterCouponCents - giftCardUsedCents,
    0,
  );

  const [openAuth, setOpenAuth] = useState(false);
  const [openPhone, setOpenPhone] = useState(false);

  // para reintentar confirm cuando termine login / phone
  const [pendingConfirm, setPendingConfirm] = useState(false);

  const validateCouponForCurrentDraft = useCallback(
    async (code: string) => {
      if (!booking.branch?.id) {
        throw new Error("Sucursal inválida para validar cupón.");
      }

      const appointments = [...(booking.appointmentsDraft ?? [])];
      const getAmountCents = (serviceId: string, draftAmount?: number | null) =>
        typeof draftAmount === "number"
          ? draftAmount
          : (booking.catalog.find((s) => s.id === serviceId)?.priceCents ?? 0);
      const subtotalCents = appointments.reduce(
        (acc, a) => acc + getAmountCents(a.serviceId, a.priceCents),
        0,
      );

      return validatePublicCoupon({
        code,
        branchId: booking.branch.id,
        amountCents: subtotalCents,
        serviceIds: appointments.map((a) => a.serviceId),
        serviceItems: appointments.map((a) => ({
          serviceId: a.serviceId,
          amountCents: getAmountCents(a.serviceId, a.priceCents),
        })),
      });
    },
    [booking.branch?.id, booking.appointmentsDraft, booking.catalog],
  );

  function getCouponErrorMessage(err: unknown): string {
    if (err instanceof PublicApiError) return err.message;
    if (err instanceof Error) return err.message;
    return "Cupón no aplicable para estos servicios.";
  }

  async function handleSelectCoupon(c: {
    id: string;
    code: string;
    type: "percentage" | "fixed";
    value: number;
    expiresAt?: string | null;
    serviceName?: string | null;
    serviceNames?: string[];
  }) {
    setCouponMessage(null);
    setCouponMessageType(null);

    try {
      const res = await validateCouponForCurrentDraft(c.code);
      setCouponDiagnostics((prev) => ({
        ...prev,
        [c.id]: {
          valid: true,
          reason: `Aplica: -$${(res.discountCents / 100).toFixed(2)}`,
          discountCents: res.discountCents,
        },
      }));
      dispatch({
        type: "SELECT_COUPON",
        payload: c.id,
      });
      dispatch({
        type: "SET_APPLIED_COUPON",
        payload: {
          code: c.code,
          discountCents: res.discountCents,
        },
      });
      setDiscountCode(c.code);
      setCouponMessageType("success");
      setCouponMessage(
        `Cupón válido. Descuento: $${(res.discountCents / 100).toFixed(2)}`,
      );
    } catch (err: unknown) {
      const reason = getCouponErrorMessage(err);
      setCouponDiagnostics((prev) => ({
        ...prev,
        [c.id]: {
          valid: false,
          reason,
        },
      }));
      dispatch({
        type: "SELECT_COUPON",
        payload: null,
      });
      dispatch({ type: "SET_APPLIED_COUPON", payload: null });
      setCouponMessageType("error");
      setCouponMessage(reason);
    }
  }

  // ===============================
  // Load benefits (public)
  // ===============================
  useEffect(() => {
    async function loadBenefits() {
      if (!booking.branch?.id) return;

      try {
        dispatch({ type: "SET_BENEFITS_LOADING", payload: true });
        const data = await getPaymentBenefits(booking.branch.id);
        dispatch({ type: "SET_BENEFITS", payload: data });
      } catch {
        dispatch({
          type: "SET_BENEFITS",
          payload: {
            isAuthenticated: false,
            hasActiveProgram: false,
            coupons: [],
            giftCards: [],
            pointsBalance: 0,
            redeemableRewards: { availableCount: 0, rewards: [] },
            tier: null,
            tierRewards: [],
          },
        });
      } finally {
        dispatch({ type: "SET_BENEFITS_LOADING", payload: false });
      }
    }

    loadBenefits();
  }, [booking.branch?.id, dispatch]);

  async function handleConfirm() {
    if (!canConfirm) return;
    if (submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    const splashStart = Date.now();
    setShowSplash(true); // ✅ PRENDE SPLASH

    try {
      const appointments = [...appointmentsDraft].sort((a, b) =>
        a.startIso.localeCompare(b.startIso),
      );

      const selectedCoupon = booking.benefits.coupons.find(
        (c) => c.id === booking.selectedCouponId,
      );

      const couponCode =
        selectedCoupon?.code ?? (discountCode?.trim() ? discountCode.trim() : "");

      if (couponCode) {
        await validateCouponForCurrentDraft(couponCode);
      }

      const payload: CreatePublicBookingPayload = {
        branchSlug: branch!.slug,
        date: date!,
        paymentMethod: (paymentMethod ?? "ONSITE") as "ONSITE" | "ONLINE",
        discountCode: couponCode ? couponCode : null,
        giftCardCode: selectedGiftCard?.code ?? "",
        giftCardAmountCents: giftCardUsedCents,
        notes: notes?.trim() ? notes.trim() : null,
        appointments,
      };

      const res = await createPublicBooking(payload);

      // ✅ asegúrate que el splash dure mínimo 1500ms (1.5s)
      const elapsed = Date.now() - splashStart;
      const remaining = Math.max(0, 2000 - elapsed);
      if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));

      router.push(`/me/bookings/${res.bookingId}`);
    } catch (err: unknown) {
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

      const message =
        err instanceof Error
          ? err.message
          : "No se pudo confirmar la reservación";
      setSubmitError(message);
      setShowSplash(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (!booking.date || booking.appointmentsDraft.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Revisar y confirmar</h1>
        <p className="text-sm text-muted-foreground">
          Primero selecciona un horario.
        </p>

        <Button variant="outline" onClick={() => router.back()}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 pb-[420px]">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Revisar y confirmar</h1>
        <p className="text-sm text-muted-foreground">
          Confirma tu cita antes de reservar
        </p>
      </div>

      {/* Método de pago */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Método de pago</h2>

        <div className="space-y-3">
          <PaymentCardMobile
            active={paymentMethod === "ONSITE"}
            onClick={() => setPaymentMethod("ONSITE")}
            icon={<Store className="w-5 h-5" />}
            title="Pagar en el establecimiento"
            subtitle="Paga al llegar a tu cita"
          />

          <PaymentCardMobile
            active={paymentMethod === "ONLINE"}
            onClick={() => setPaymentMethod("ONLINE")}
            icon={<CreditCard className="w-5 h-5" />}
            title="Pagar en línea"
            subtitle="Con tarjeta (próximamente)"
          />
        </div>
      </section>

      {/* Beneficios (solo si hay programa activo) */}
      {booking.benefitsLoading && (
        <div className="text-sm text-muted-foreground">
          Cargando beneficios…
        </div>
      )}

      {!booking.benefitsLoading && booking.benefits.hasActiveProgram && (
        <button
          type="button"
          onClick={() => setRewardsSheetOpen(true)}
          className="w-full border border-x-0 border-black/10 px-2 py-4 flex items-center gap-1 text-left"
        >
          <div className="h-11 w-11 rounded-xl flex items-center justify-center">
            <GradientGem className="h-6 w-6 " />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {booking.benefits.pointsBalance > 0
                ? `Tienes ${booking.benefits.pointsBalance.toLocaleString()} pts en ${booking.branch?.name}`
                : "Aún no tienes puntos acumulados en esta sucursal"}
            </p>
          </div>

          <ChevronRight className="text-muted-foreground shrink-0" />
        </button>
      )}

      {!booking.benefitsLoading &&
        booking.benefits.hasActiveProgram &&
        (booking.benefits.giftCards.length > 0 ||
          booking.benefits.coupons.length > 0) && (
          <BenefitsUnifiedSlider
            giftCards={booking.benefits.giftCards}
            coupons={booking.benefits.coupons}
            selectedGiftCardId={booking.selectedGiftCardId}
            selectedCouponId={booking.selectedCouponId}
            branchName={booking.branch?.name}
            couponDiagnostics={couponDiagnostics}
            onSelectGiftCard={(id) =>
              dispatch({
                type: "SELECT_GIFT_CARD",
                payload: { id, amount: 0 },
              })
            }
            onSelectCoupon={handleSelectCoupon}
          />
        )}

      {couponMessage && (
        <p
          className={cn(
            "text-xs",
            couponMessageType === "error"
              ? "text-red-600"
              : "text-emerald-700",
          )}
        >
          {couponMessage}
        </p>
      )}

      {/* Código de descuento */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Código de descuento</h2>

        <div className="space-y-3">
          <input
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            placeholder="Código"
            className="h-12 w-full rounded-2xl border px-4 text-sm outline-none focus:border-indigo-500"
          />

          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-2xl"
            disabled={!discountCode.trim() || applyingDiscount}
            onClick={async () => {
              try {
                setApplyingDiscount(true);
                setCouponMessage(null);
                setCouponMessageType(null);

                if (!booking.branch?.id) {
                  setCouponMessage("Sucursal inválida para validar cupón.");
                  return;
                }

                const res = await validateCouponForCurrentDraft(
                  discountCode.trim(),
                );

                const foundCoupon = booking.benefits.coupons.find(
                  (c) => c.code.toLowerCase() === discountCode.trim().toLowerCase(),
                );
                dispatch({
                  type: "SELECT_COUPON",
                  payload: foundCoupon?.id ?? null,
                });
                dispatch({
                  type: "SET_APPLIED_COUPON",
                  payload: {
                    code: discountCode.trim(),
                    discountCents: res.discountCents,
                  },
                });
                setCouponMessageType("success");
                setCouponMessage(
                  `Cupón válido. Descuento: $${(res.discountCents / 100).toFixed(2)}`,
                );
              } catch (err: unknown) {
                dispatch({ type: "SET_APPLIED_COUPON", payload: null });
                setCouponMessageType("error");
                if (err instanceof PublicApiError) {
                  setCouponMessage(err.message);
                } else {
                  setCouponMessage("No se pudo validar el cupón.");
                }
              } finally {
                setApplyingDiscount(false);
              }
            }}
          >
            {applyingDiscount ? "Aplicando..." : "Aplicar descuento"}
          </Button>
        </div>
      </section>

      {/* Notas */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Notas</h2>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Comentarios o solicitudes para tu cita"
          className="min-h-[140px] w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none focus:border-indigo-500"
        />
      </section>

      {/* Sticky confirm */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-white/95 backdrop-blur-md">
        <div className="pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] space-y-2">
          {/* RESUMEN */}
          <div className="rounded-2xl border border-black/10 bg-white px-4 py-2.5 mx-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">Tu reserva</p>
                <p className="text-sm font-semibold truncate">
                  {booking.branch?.name ?? "Sucursal"} · {booking.services.length} servicios
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {booking.date ?? "Sin fecha"} ·{" "}
                  {booking.selectedPlan?.startLocalLabel ??
                    booking.time ??
                    "Sin hora"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] text-muted-foreground">Total</p>
                <p className="text-sm font-semibold">
                  {totalAfterDiscountCents > 0
                    ? `$${Math.round(totalAfterDiscountCents / 100)} MXN`
                    : "Gratis"}
                </p>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-black/10 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">Subtotal</p>
                <p className="text-xs font-medium">
                  {subtotalCents > 0
                    ? `$${Math.round(subtotalCents / 100)} MXN`
                    : "Gratis"}
                </p>
              </div>

              {couponDiscountCents > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">
                    Cupón {booking.appliedCouponCode ? `(${booking.appliedCouponCode})` : ""}
                  </p>
                  <p className="text-xs font-medium text-emerald-700">
                    -${Math.round(couponDiscountCents / 100)} MXN
                  </p>
                </div>
              )}

              {giftCardUsedCents > 0 && selectedGiftCard && (
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">
                    Gift card ({selectedGiftCard.code})
                  </p>
                  <p className="text-xs font-medium text-emerald-700">
                    -${Math.round(giftCardUsedCents / 100)} MXN
                  </p>
                </div>
              )}
            </div>
          </div>

          {booking.benefits.pointsBalance > 0 && (
            <button
              type="button"
              onClick={() => setRewardsSheetOpen(true)}
              className="w-full text-white px-4 py-3"
              style={{
                background: "linear-gradient(135deg, #5b5bf7, #c14ef0)",
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-normal">
                    {booking.benefits.redeemableRewards.availableCount > 0
                      ? `${booking.benefits.redeemableRewards.availableCount} recompensas disponibles`
                      : "Desbloquea recompensas"}
                  </span>
                </div>
                <ChevronRight className="text-white/90 h-4 w-4" />
              </div>
            </button>
          )}

          <Button
            className="w-full rounded-full py-5"
            disabled={!canConfirm || submitting}
            onClick={handleConfirm}
          >
            {submitting ? "Confirmando..." : "Confirmar reserva"}
          </Button>

          {submitError && (
            <p className="text-xs text-red-600 text-center">{submitError}</p>
          )}

          <p className="text-[11px] text-muted-foreground text-center">
            Al confirmar, aceptas las condiciones del establecimiento.
          </p>
        </div>
      </div>
      <BookingConfirmSplash
        open={showSplash}
        title="Reservación confirmada"
        subtitle="Estamos guardando tu cita…"
      />
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
      <AvailableRewardsMobileDrawer
        open={rewardsSheetOpen}
        onOpenChange={setRewardsSheetOpen}
        branchId={booking.branch?.id}
      />
    </div>
  );
}

function PaymentCardMobile({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border p-4 text-left transition flex items-start gap-3",
        active
          ? "border-indigo-500 bg-indigo-50"
          : "border-black/10 bg-white active:bg-black/[0.02]",
      )}
    >
      <div
        className={cn(
          "mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          active ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-700",
        )}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{title}</p>
        <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
      </div>
    </button>
  );
}

const GradientGem = ({
  style,
  className,
  ...props
}: LucideProps & { style?: { text?: string } & React.CSSProperties }) => {
  const gradientId = "gem-gradient-inline";

  return (
    <>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5b5bf7" />
            <stop offset="100%" stopColor="#c14ef0" />
          </linearGradient>
        </defs>
      </svg>

      <Gem
        {...props}
        className={className}
        style={style}
        stroke={`url(#${gradientId})`}
      />
    </>
  );
};
