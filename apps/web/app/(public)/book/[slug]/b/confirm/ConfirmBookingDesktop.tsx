"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { usePublicBooking } from "@/context/PublicBookingContext";
import { cn } from "@/lib/utils";
import { ChevronRight, CreditCard, Gem, LucideProps, Sparkle, Sparkles, Store } from "lucide-react";
import { color, motion } from "framer-motion";
import {
  getPaymentBenefits,
  PaymentBenefits,
} from "@/lib/services/public/payments";
import { CategoryIcon } from "@/components/shared/Icon";

type PaymentMethod = "ONSITE" | "ONLINE";

export function ConfirmBookingDesktopPage() {
  const router = useRouter();
  const booking = usePublicBooking();
  const { dispatch } = booking;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ONSITE");
  const [discountCode, setDiscountCode] = useState("");
  const [notes, setNotes] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  useEffect(() => {
    async function loadBenefits() {
      if (!booking.branch?.id) return;

      try {
        dispatch({
          type: "SET_BENEFITS_LOADING",
          payload: true,
        });
        const data = await getPaymentBenefits(booking.branch.id);
        console.log(data)

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

  return (
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

        <div className="flex gap-3">
          <input
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            placeholder="Introduce el código de descuento"
            className="h-12 w-full rounded-2xl border px-4 text-sm outline-none focus:border-indigo-500"
          />

          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-2xl px-6"
            disabled={!discountCode.trim() || applyingDiscount}
            onClick={async () => {
              try {
                setApplyingDiscount(true);

                // TODO: aquí conectas tu endpoint real
                console.log("APLICAR DESCUENTO:", {
                  code: discountCode.trim(),
                  branchSlug: booking.branch?.slug,
                });

                // Simulación
                await new Promise((r) => setTimeout(r, 500));
              } finally {
                setApplyingDiscount(false);
              }
            }}
          >
            {applyingDiscount ? "Aplicando..." : "Aplicar"}
          </Button>
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
              <div className="w-full border border-x-0 px-5 py-4 flex items-center gap-3 cursor-pointer ">
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
                  <ChevronRight className="text-muted-foreground shrink-0 cursor-pointer"/>
                </div>
              )}
              {/* ========================= */}
              {/* GIFT CARDS */}
              {/* ========================= */}
              {/* ========================= */}
              {/* GIFT CARDS */}
              {/* ========================= */}
              {booking.benefits.giftCards.length > 0 && (
                <div className="rounded-3xl">
                  <div className="space-y-4 max-w-[900px] mx-auto">
                    <p className="text-sm font-medium text-black/90">
                      Gift cards
                    </p>

                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {booking.benefits.giftCards.map((gc) => {
                        const isSelected = booking.selectedGiftCardId === gc.id;

                        return (
                          <button
                            key={gc.id}
                            type="button"
                            onClick={() =>
                              dispatch({
                                type: "SELECT_GIFT_CARD",
                                payload: {
                                  id: gc.id,
                                },
                              })
                            }
                            className="min-w-[280px] focus:outline-none"
                          >
                            <div
                              className={cn(
                                "relative w-full h-[160px] rounded-2xl p-5 text-white flex flex-col justify-between border",
                                isSelected ? "border-white" : "border-white/30",
                              )}
                              style={{
                                background:
                                  "linear-gradient(135deg, #5b5bf7, #c14ef0)",
                              }}
                            >
                              {/* INDICADOR */}
                              <div className="absolute top-4 right-4">
                                <div
                                  className={cn(
                                    "w-5 h-5 rounded-full border flex items-center justify-center",
                                    isSelected
                                      ? "bg-white border-white"
                                      : "border-white/70",
                                  )}
                                >
                                  {isSelected && (
                                    <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                                  )}
                                </div>
                              </div>

                              {/* CONTENT */}
                              <p className="text-sm font-medium truncate">
                                {booking.branch?.name ?? "Tu negocio"}
                              </p>

                              <p className="text-2xl font-semibold">
                                ${(gc.balanceCents / 100).toFixed(0)}
                              </p>

                              <p className="text-xs font-mono opacity-80">
                                {gc.code}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================= */}
              {/* COUPONS */}
              {/* ========================= */}
              {booking.benefits.coupons.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Cupones</p>

                  {booking.benefits.coupons.map((c) => {
                    const selected = booking.selectedCouponId === c.id;

                    const discount =
                      c.type === "percentage"
                        ? `${c.value}%`
                        : `$${(c.value / 100).toFixed(0)}`;

                    const fromTier = booking.benefits.tierRewards.some((tr) => {
                      const config = tr.config as any;
                      if (config?.type === "coupon_percentage" && c.type === "percentage") {
                        return config.value === c.value;
                      }
                      if (config?.type === "coupon_fixed" && c.type === "fixed") {
                        return config.value === c.value;
                      }
                      return false;
                    });

                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          dispatch({
                            type: "SELECT_COUPON",
                            payload: c.id,
                          })
                        }
                        className={cn(
                          "w-full rounded-2xl border p-4 flex justify-between items-center gap-3",
                          selected
                            ? "border-indigo-500 bg-indigo-50"
                            : "hover:bg-gray-50",
                        )}
                      >
                        <div>
                          <p className="font-medium">{c.code}</p>
                          <p className="text-xs text-muted-foreground">
                            {fromTier ? "Cupón de tu tier" : "Cupón disponible"}
                          </p>
                        </div>

                        <p className="font-semibold text-indigo-600">
                          {discount}
                        </p>

                        {fromTier && (
                          <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                            Tier
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ========================= */}
              {/* EMPTY STATE */}
              {/* ========================= */}
              {booking.benefits.giftCards.length === 0 &&
                booking.benefits.coupons.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No tienes beneficios disponibles.
                  </div>
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
