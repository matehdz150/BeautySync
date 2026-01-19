"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { usePublicBooking } from "@/context/PublicBookingContext";
import { cn } from "@/lib/utils";
import { CreditCard, Store } from "lucide-react";
import { motion } from "framer-motion";

type PaymentMethod = "ONSITE" | "ONLINE";

export function ConfirmBookingDesktopPage() {
  const router = useRouter();
  const booking = usePublicBooking();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ONSITE");
  const [discountCode, setDiscountCode] = useState("");
  const [notes, setNotes] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  const canReserve = useMemo(() => {
    return Boolean(
      booking.branch && booking.date && booking.appointmentsDraft.length > 0
    );
  }, [booking.branch, booking.date, booking.appointmentsDraft]);

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
                : "hover:bg-gray-50"
            )}
          >
            <div
              className={cn(
                "mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                paymentMethod === "ONSITE"
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 text-gray-700"
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
                : "hover:bg-gray-50"
            )}
          >
            <div
              className={cn(
                "mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                paymentMethod === "ONLINE"
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 text-gray-700"
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