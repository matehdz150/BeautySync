"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { usePublicBooking } from "@/context/PublicBookingContext";
import { cn } from "@/lib/utils";
import { ChevronRight, CreditCard, Gem, LucideProps, Sparkles, Store } from "lucide-react";
import { motion } from "framer-motion";
import {
  getPaymentBenefits,
  validatePublicCoupon,
} from "@/lib/services/public/payments";
<<<<<<< HEAD
import { validateCoupon } from "@/lib/services/public/coupons";
=======
import { AvailableRewardsSheet } from "@/components/loyal-program/AvailableRewardsSheet";
import { PublicApiError } from "@/lib/errors";
import { BenefitsUnifiedSlider } from "@/components/book/BenefitsUnifiedSlider";
>>>>>>> 8316d89 (feat[benefits] benefits on booking working)

type PaymentMethod = "ONSITE" | "ONLINE";
type CouponDiagnostic = {
  valid: boolean;
  reason: string;
  discountCents?: number;
};

export function ConfirmBookingDesktopPage() {
  const router = useRouter();
  const booking = usePublicBooking();
  const { dispatch } = booking;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ONSITE");
  const [discountCode, setDiscountCode] = useState("");
  const [notes, setNotes] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);
<<<<<<< HEAD
  const [couponMessage, setCouponMessage] = useState("");

  function formatCouponMessage(type: string, value: number) {
    if (type === "percentage") {
      return `${value}% de descuento`;
    }

    const amount = Math.round(value / 100);
    return `$${amount} MXN de descuento`;
=======
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponMessageType, setCouponMessageType] = useState<
    "error" | "success" | null
  >(null);
  const [rewardsSheetOpen, setRewardsSheetOpen] = useState(false);
  const [couponDiagnostics, setCouponDiagnostics] = useState<
    Record<string, CouponDiagnostic>
  >({});

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
>>>>>>> 8316d89 (feat[benefits] benefits on booking working)
  }

  useEffect(() => {
    async function loadBenefits() {
      if (!booking.branch?.id) return;

      try {
        dispatch({
          type: "SET_BENEFITS_LOADING",
          payload: true,
        });
        const data = await getPaymentBenefits(booking.branch.id);
<<<<<<< HEAD
        console.log(data);
=======
>>>>>>> 8316d89 (feat[benefits] benefits on booking working)

        dispatch({
          type: "SET_BENEFITS",
          payload: data,
        });
        dispatch({
          type: "SET_BENEFITS_LOADING",
          payload: false,
        });
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
        dispatch({
          type: "SET_BENEFITS_LOADING",
          payload: false,
        });
      }
    }

    loadBenefits();
  }, [booking.branch?.id, dispatch]);

  if (!booking.date || booking.appointmentsDraft.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Revisar y confirmar</h1>
        <p className="text-sm text-muted-foreground">
          Primero selecciona un horario.
        </p>

        <Button variant="outline" onClick={() => router.back()}>
          Volver
        </Button>
      </div>
    );
  }

  const content = (
    <div className="space-y-8">
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

      {/* HEADER */}
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">
          Revisar y confirmar
        </h1>
      </div>

      {/* MÉTODO DE PAGO */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Método de pago</h2>

        <div className="space-y-3">
          {/* ONSITE */}
          <button
            type="button"
            onClick={() => setPaymentMethod("ONSITE")}
            className={cn(
              "w-full rounded-2xl border p-4 text-left transition flex items-start gap-3",
              paymentMethod === "ONSITE"
                ? "border-indigo-500 bg-indigo-50"
                : "hover:bg-gray-50",
            )}
          >
            <div
              className={cn(
                "mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                paymentMethod === "ONSITE"
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 text-gray-700",
              )}
            >
              <Store className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <p className="font-medium">Pagar en el establecimiento</p>
              <p className="text-sm text-muted-foreground">
                Paga al llegar a tu cita
              </p>
            </div>
          </button>

          {/* ONLINE */}
          <button
            type="button"
            onClick={() => setPaymentMethod("ONLINE")}
            className={cn(
              "w-full rounded-2xl border p-4 text-left transition flex items-start gap-3",
              paymentMethod === "ONLINE"
                ? "border-indigo-500 bg-indigo-50"
                : "hover:bg-gray-50",
            )}
          >
            <div
              className={cn(
                "mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                paymentMethod === "ONLINE"
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 text-gray-700",
              )}
            >
              <CreditCard className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <p className="font-medium">Pagar en línea</p>
              <p className="text-sm text-muted-foreground">
                Paga ahora con tarjeta (próximamente)
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* CÓDIGO DE DESCUENTO */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Código de descuento</h2>

        <div className="space-y-2">
          <div className="flex gap-3">
            <input
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="Introduce el código de descuento"
              className="h-12 w-full rounded-2xl border px-4 text-sm outline-none focus:border-indigo-500"
              disabled={!!couponMessage}
            />

<<<<<<< HEAD
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-2xl px-6"
              disabled={!discountCode.trim() || applyingDiscount}
              onClick={async () => {
                try {
                  setApplyingDiscount(true);

                  const subtotal = booking.appointmentsDraft.reduce(
                    (acc, a) => {
                      const srv = booking.catalog.find(
                        (s) => s.id === a.serviceId,
                      );
                      return acc + (srv?.priceCents ?? 0);
                    },
                    0,
                  );

                  const res = await validateCoupon({
                    code: discountCode.trim(),
                    branchId: booking.branch!.id,
                    amountCents: subtotal,
                    services: booking.services,
                  });

                  console.log(res);

                  // ✅ si llegó aquí → es válido (tu backend ya valida)
                  setCouponMessage(
                    formatCouponMessage(res.coupon.type, res.coupon.value),
                  );

                  dispatch({
                    type: "SET_VALIDATED_COUPON",
                    payload: {
                      id: res.coupon.id,
                      code: discountCode.trim(), // 🔥 IMPORTANTE
                      discountCents: res.discountCents,
                    },
                  });
                } catch (err) {
                  console.error("Error validando cupón:", err);

                  // limpia UI
                  setCouponMessage("");

                  dispatch({
                    type: "SELECT_COUPON",
                    payload: null,
                  });
                } finally {
                  setApplyingDiscount(false);
                }
              }}
            >
              {applyingDiscount ? "Aplicando..." : "Aplicar"}
            </Button>
          </div>

          {/* ✅ MENSAJE BONITO */}
          {couponMessage && (
            <div className="relative rounded-2xl overflow-hidden shadow-sm border w-full max-w-sm">
              {/* BACKGROUND */}
              <div
                className="px-5 py-4 text-white"
                style={{
                  background:
                    "linear-gradient(135deg, #f87171, #fb7185, #f97316)",
                }}
              >
                {/* badge */}
                <div className="text-[10px] uppercase tracking-wide bg-white/20 inline-block px-2 py-1 rounded-full mb-2">
                  Oferta aplicada
                </div>

                {/* main */}
                <div className="space-y-1">
                  <p className="text-lg font-semibold">Cupón activo</p>

                  <p className="text-sm opacity-90">{couponMessage}</p>
                </div>
              </div>

              {/* FOOTER */}
              <div className="bg-white px-5 py-3 flex items-center justify-between text-xs">
                <span className="text-gray-500">Descuento aplicado</span>

                <button
                  onClick={() => {
                    setCouponMessage("");
                    dispatch({
                      type: "SELECT_COUPON",
                      payload: null,
                    });
                  }}
                  className="text-red-500 font-medium hover:underline"
                >
                  Quitar
                </button>
              </div>

              {/* CLOSE ICON (opcional arriba) */}
              <button
                onClick={() => {
                  setCouponMessage("");
                  dispatch({
                    type: "SELECT_COUPON",
                    payload: null,
                  });
                }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 text-gray-600 text-xs flex items-center justify-center hover:bg-white"
              >
                ×
              </button>
            </div>
          )}
=======
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-2xl px-6"
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
                if (err instanceof Error) {
                  setCouponMessage(err.message);
                } else {
                  setCouponMessage("No se pudo validar el cupón.");
                }
              } finally {
                setApplyingDiscount(false);
              }
            }}
          >
            {applyingDiscount ? "Aplicando..." : "Aplicar"}
          </Button>
>>>>>>> 8316d89 (feat[benefits] benefits on booking working)
        </div>
        {/* BENEFICIOS */}
        <section className="space-y-2 pt-2">
          <h2 className="text-lg font-semibold">Tus beneficios</h2>

          {booking.benefitsLoading && (
            <div className="text-sm text-muted-foreground">
              Cargando beneficios...
            </div>
          )}

          {!booking.benefitsLoading && booking.benefits && (
            <div className="space-y-6">
              {/* ========================= */}
              {/* TIER & POINTS */}
              {/* ========================= */}
              {booking.benefits.hasActiveProgram && (
                <button
                  type="button"
                  onClick={() => setRewardsSheetOpen(true)}
                  className="w-full border border-x-0 px-5 py-4 flex items-center gap-3 cursor-pointer text-left"
                >
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center">
                    <GradientGem className="h-8 w-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium truncate">
                      {booking.benefits.pointsBalance > 0
                        ? `Tienes ${booking.benefits.pointsBalance.toLocaleString()} pts en ${booking.branch?.name.toLowerCase()}`
                        : "Aún no tienes puntos acumulados en esta sucursal"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 cursor-pointer">
                    <Sparkles className="h-4 w-4" />
                    {booking.benefits.pointsBalance > 0
                      ? `${booking.benefits.redeemableRewards.availableCount} recompensas`
                      : "Cómo ganar puntos"}
                  </div>
                  <ChevronRight className="text-muted-foreground shrink-0 cursor-pointer" />
                </button>
              )}
              {(booking.benefits.giftCards.length > 0 ||
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
                      payload: {
                        id,
                        amount: 0,
                      },
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
            </div>
          )}
        </section>
      </section>

      {/* NOTAS */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Notas de la reserva</h2>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Incluir comentarios o solicitudes a tu reserva"
          className="min-h-[140px] w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none focus:border-indigo-500"
        />
      </section>
    </div>
  );

  return (
    <>
      {content}
      <AvailableRewardsSheet
        open={rewardsSheetOpen}
        onOpenChange={setRewardsSheetOpen}
        branchId={booking.branch?.id}
      />
    </>
  );
}


const GradientGem = ({ style, className, ...props }: LucideProps & { style?: { text?: string } & React.CSSProperties }) => {
  const gradientId = "gem-gradient-inline";

  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
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
