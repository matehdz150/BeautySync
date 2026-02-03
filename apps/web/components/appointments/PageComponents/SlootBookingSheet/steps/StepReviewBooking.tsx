"use client";

import { DateTime } from "luxon";
import { Briefcase, Clock, User, Lock, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { useSlotBooking } from "@/context/SlotBookingContext";
import { useState } from "react";
import { createManagerBooking } from "@/lib/services/appointments";
import { useCalendarActions } from "@/context/CalendarContext";
import { buildBookingSuccessAlert } from "@/lib/ui/bookingAlerts";
import { useUIAlerts } from "@/context/UIAlertsContext";
import { cn } from "@/lib/utils";

export function StepReviewBooking() {
  const { state, actions } = useSlotBooking();
  const { branchId, services } = state;
  const { addAppointments, closeSlotBooking } = useCalendarActions();
  const { showAlert } = useUIAlerts();

  const [submitting, setSubmitting] = useState(false);

  const hasUnassignedStaff = services.some(
    (s, i) => i !== 0 && s.staffId === "ANY"
  );

  const SLOT_MINUTES = 15;

  function roundUpToSlot(minutes: number) {
    return Math.ceil(minutes / SLOT_MINUTES) * SLOT_MINUTES;
  }

  async function confirmBooking() {
    if (!branchId) return;
    if (hasUnassignedStaff) return;
    if (services.length === 0) return;

    setSubmitting(true);

    try {
      // ============================
      // Build appointments payload
      // ============================
      const appointments = services.map((s) => {
        const roundedDuration = roundUpToSlot(s.durationMin);

        const start = DateTime.fromISO(s.startIso);
        const end = start.plus({ minutes: roundedDuration });

        return {
          serviceId: s.serviceId,
          staffId: s.staffId as string, // 🔒 validado (NO "ANY")
          startIso: start.toISO()!,
          endIso: end.toISO()!,
          durationMin: roundedDuration,
        };
      });

      // ============================
      // Create booking (BACKEND)
      // ============================
      const res = await createManagerBooking({
        branchId,
        clientId: state.client?.id ?? null, // ✅ CLIENTE AQUÍ
        date: DateTime.fromISO(services[0].startIso).toISODate()!,
        paymentMethod: "ONSITE",
        appointments,
      });

      // ============================
      // ENRICH + ADD TO CALENDAR
      // ============================
      const enriched = services.map((s, index) => {
        const roundedDuration = roundUpToSlot(s.durationMin);

        const startUtc = DateTime.fromISO(s.startIso);
        const endUtc = startUtc.plus({ minutes: roundedDuration });

        return {
          // 🔑 ID REAL DEL BACKEND
          id: res.appointmentIds[index],

          // 🔑 BOOKING ID (CLAVE)
          bookingId: res.publicBookingId,

          staffId: s.staffId as string,
          staffName: s.staffName ?? "Staff",

          client: state.client?.name ?? "Cliente",
          serviceName: s.serviceName,
          serviceColor: "#A78BFA",

          startISO: startUtc.toISO()!,
          endISO: endUtc.toISO()!,
          startTime: startUtc.toLocal().toFormat("H:mm"),
          minutes: roundedDuration,
        };
      });

      addAppointments(enriched);

      // ============================
      // Close + reset
      // ============================
      closeSlotBooking();
      showAlert(
        buildBookingSuccessAlert({
          clientName: state.client?.name,
          startIso: services[0].startIso,
        })
      );
      actions.reset();
    } catch (error) {
      console.error("Error creating booking:", error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* ================= HEADER ================= */}
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">
          Revisar y confirmar cita
        </h2>
        <p className="text-sm text-muted-foreground">
          Verifica los servicios y el staff antes de crear la cita.
        </p>
      </div>

      {/* ================= TIMELINE ================= */}
      <div className="space-y-4">
        {services.map((s, index) => {
          const start = DateTime.fromISO(s.startIso).toLocal();
          const isFirst = index === 0;

          return (
            <div
              key={index}
              className={cn(
                "relative rounded-2xl border p-4 bg-white",
                isFirst && "border-indigo-500/40 bg-indigo-50/40"
              )}
            >
              {/* LEFT LINE */}
              {index !== services.length - 1 && (
                <span className="absolute left-5 top-14 bottom-0 w-px bg-black/10" />
              )}

              <div className="flex gap-4">
                {/* DOT */}
                <div
                  className={cn(
                    "mt-1 h-3 w-3 rounded-full",
                    isFirst ? "bg-indigo-500" : "bg-black/30"
                  )}
                />

                {/* CONTENT */}
                <div className="flex-1 space-y-3">
                  {/* TITLE */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{s.serviceName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {start.toFormat("HH:mm")} · {s.durationMin} min
                      </p>
                    </div>

                    {/* BADGE */}
                    {isFirst ? (
                      <Badge className="gap-1">
                        <Lock className="h-3 w-3" />
                        Fijo
                      </Badge>
                    ) : (
                      <Badge variant="outline">{s.staffName}</Badge>
                    )}
                  </div>

                  {/* STAFF */}
                  {!isFirst ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {s.staffName}
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => actions.setStep(2)}
                        className="h-8 px-2"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Cambiar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      El staff del primer servicio no se puede modificar
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= WARNINGS ================= */}
      {hasUnassignedStaff && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Asigna un miembro del staff a todos los servicios antes de confirmar.
        </div>
      )}

      {/* ================= ACTIONS ================= */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="ghost"
          onClick={() => actions.setStep(2)}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Agregar servicio
        </Button>

        <Button
          size="lg"
          onClick={confirmBooking}
          disabled={submitting || hasUnassignedStaff}
          className="px-8"
        >
          {submitting ? "Confirmando…" : "Confirmar cita"}
        </Button>
      </div>
    </div>
  );
}
