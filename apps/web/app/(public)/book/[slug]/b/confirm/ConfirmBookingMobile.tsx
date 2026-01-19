"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Store } from "lucide-react";

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

type PaymentMethod = "ONSITE" | "ONLINE";

export function ConfirmBookingMobilePage() {
  const router = useRouter();
  const booking = usePublicBooking();

  const { branch, date, appointmentsDraft } = booking as any;

  // ✅ estos 3 deben ser estado local en este componente
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ONSITE");
  const [discountCode, setDiscountCode] = useState("");
  const [notes, setNotes] = useState("");

  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [showSplash, setShowSplash] = useState(false);

  const canConfirm = useMemo(() => {
    return Boolean(branch && date && appointmentsDraft?.length > 0);
  }, [branch, date, appointmentsDraft]);

  const [openAuth, setOpenAuth] = useState(false);
  const [openPhone, setOpenPhone] = useState(false);

  // para reintentar confirm cuando termine login / phone
  const [pendingConfirm, setPendingConfirm] = useState(false);

  async function handleConfirm() {
    if (!canConfirm) return;
    if (submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    const splashStart = Date.now();
    setShowSplash(true); // ✅ PRENDE SPLASH

    try {
      const appointments = [...appointmentsDraft].sort((a, b) =>
        a.startIso.localeCompare(b.startIso)
      );

      const payload: CreatePublicBookingPayload = {
        branchSlug: branch!.slug,
        date: date!,
        paymentMethod: (paymentMethod ?? "ONSITE") as "ONSITE" | "ONLINE",
        discountCode: discountCode?.trim() ? discountCode.trim() : null,
        notes: notes?.trim() ? notes.trim() : null,
        appointments,
      };

      const res = await createPublicBooking(payload);

      // ✅ asegúrate que el splash dure mínimo 1500ms (1.5s)
      const elapsed = Date.now() - splashStart;
      const remaining = Math.max(0, 2000 - elapsed);
      if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));

      router.push(`/me/bookings/${res.bookingId}`);
    } catch (err: any) {
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

                console.log("APLICAR DESCUENTO:", {
                  code: discountCode.trim(),
                  branchSlug: booking.branch?.slug,
                });

                await new Promise((r) => setTimeout(r, 500));
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
        <div className="px-4 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))] space-y-3">
          {/* RESUMEN */}
          <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              {/* Left */}
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Tu reserva</p>

                <p className="text-sm font-semibold truncate">
                  {booking.branch?.name ?? "Sucursal"}
                </p>

                <p className="mt-1 text-xs text-muted-foreground truncate">
                  {booking.date ?? "Sin fecha"} ·{" "}
                  {booking.selectedPlan?.startLocalLabel ??
                    booking.time ??
                    "Sin hora"}
                </p>
              </div>

              {/* Right */}
              <div className="shrink-0 text-right">
                <p className="text-xs text-muted-foreground">Servicios</p>
                <p className="text-sm font-semibold">
                  {booking.services.length}
                </p>
              </div>
            </div>

            {/* LISTA DE SERVICIOS */}
            <div className="mt-3 space-y-2">
              {booking.services.map((serviceId: string) => {
                const srv = booking.catalog.find(
                  (s: any) => s.id === serviceId
                );

                const staffId = booking.staffByService?.[serviceId];
                const staff =
                  staffId && staffId !== "ANY"
                    ? booking.staffCatalog?.find((st: any) => st.id === staffId)
                    : null;

                return (
                  <div
                    key={serviceId}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">
                        {srv?.name ?? "Servicio"}
                      </p>

                      <p className="text-[11px] text-muted-foreground truncate">
                        {staffId === "ANY"
                          ? "Profesional: Cualquiera"
                          : staff
                          ? `Profesional: ${staff.name}`
                          : "Profesional: Sin asignar"}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs font-semibold">
                        {srv?.priceCents
                          ? `$${Math.round(srv.priceCents / 100)} MXN`
                          : "Gratis"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {srv?.durationMin ?? 0} min
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TOTAL */}
            <div className="mt-3 pt-3 border-t border-black/10 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-semibold">
                {(() => {
                  const total = booking.services.reduce(
                    (acc: number, id: string) => {
                      const srv = booking.catalog.find((s: any) => s.id === id);
                      return acc + (srv?.priceCents ?? 0);
                    },
                    0
                  );

                  return total > 0
                    ? `$${Math.round(total / 100)} MXN`
                    : "Gratis";
                })()}
              </p>
            </div>
          </div>

          <Button
            className="w-full rounded-full py-6"
            disabled={!canConfirm || submitting}
            onClick={handleConfirm}
          >
            {submitting ? "Confirmando..." : "Confirmar reserva"}
          </Button>

          {submitError && (
            <p className="text-xs text-red-600 text-center">{submitError}</p>
          )}

          <p className="text-xs text-muted-foreground text-center">
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
          : "border-black/10 bg-white active:bg-black/[0.02]"
      )}
    >
      <div
        className={cn(
          "mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          active ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-700"
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
