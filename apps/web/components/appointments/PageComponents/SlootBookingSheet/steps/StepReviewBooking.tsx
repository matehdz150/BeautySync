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
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h3 className="text-sm font-semibold">Review booking</h3>
        <p className="text-xs text-muted-foreground">
          Review your services before confirming.
        </p>
      </div>

      <Separator />

      {/* SERVICES */}
      <div className="space-y-4">
        {services.map((s, index) => {
          const start = DateTime.fromISO(s.startIso).toLocal();
          const isFirst = index === 0;

          return (
            <div key={index} className="rounded-lg border p-4 space-y-3">
              {/* HEADER */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-medium">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    {s.serviceName}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {start.toFormat("HH:mm")} · {s.durationMin} min
                  </div>
                </div>

                <Badge variant={isFirst ? "secondary" : "outline"}>
                  {isFirst ? (
                    <>
                      <Lock className="h-3 w-3 mr-1" />
                      Fixed
                    </>
                  ) : (
                    s.staffName
                  )}
                </Badge>
              </div>

              {/* STAFF INFO */}
              {!isFirst && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {s.staffName}
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => actions.setStep(2)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              )}

              {/* FIRST SERVICE INFO */}
              {isFirst && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Lock className="h-3 w-3" />
                  Staff for the first service is fixed.
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Separator />

      {/* ACTIONS */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => actions.setStep(2)}>
          <Plus className="h-4 w-4 mr-1" />
          Add another service
        </Button>

        <Button
          onClick={confirmBooking}
          disabled={submitting || hasUnassignedStaff}
        >
          {submitting ? "Confirming…" : "Confirm booking"}
        </Button>
      </div>

      {hasUnassignedStaff && (
        <p className="text-xs text-destructive">
          Please assign a staff member to all services before confirming.
        </p>
      )}
    </div>
  );
}
