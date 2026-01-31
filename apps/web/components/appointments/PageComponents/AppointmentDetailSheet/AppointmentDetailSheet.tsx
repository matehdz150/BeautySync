"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCalendar, useCalendarActions } from "@/context/CalendarContext";
import { DateTime } from "luxon";
import { cn } from "@/lib/utils";
import { RefreshCwOff, CalendarSync } from "lucide-react";
import {
  assignClientToBooking,
  getManagerBookingById,
} from "@/lib/services/appointments";
import { BookingHeader } from "./BookingHeader";
import { useBranch } from "@/context/BranchContext";
import { buildBookingClientAssignedAlert } from "@/lib/ui/bookingAlerts";
import { useUIAlerts } from "@/context/UIAlertsContext";
import { getBookingStatusUI } from "@/lib/ui/bookingStatus";
import { CancelBookingButton } from "./detailButtons/CancelBookingButton";

export default function AppointmentDetailSheet() {
  const { state } = useCalendar();
  const { closeAppointment } = useCalendarActions();
  const { branch } = useBranch();
  const { showAlert } = useUIAlerts();

  const appointment = state.appointments.find(
    (a: any) => a.id === state.selectedAppointmentId
  );

  const bookingId: string | null = appointment?.bookingId ?? null;

  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const open = !!appointment;

  /* ============================
     Load booking
  ============================ */
  useEffect(() => {
    if (!bookingId) {
      setBooking(null);
      setNotFound(true);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setNotFound(false);

      try {
        const res = await getManagerBookingById(bookingId);
        if (!cancelled) setBooking(res.booking);
      } catch {
        if (!cancelled) {
          setBooking(null);
          setNotFound(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (!booking) return null;

  const statusUI = getBookingStatusUI(booking.status);

  const firstAppointment = booking.appointments[0];
  const clientName = booking.client?.name ?? null;

  /* ============================
     Loading state
  ============================ */
  if (loading) {
    return (
      <Sheet open={open} onOpenChange={(o) => !o && closeAppointment()}>
        <SheetContent side="right" className="w-full !max-w-[30rem]">
          <SheetHeader>
            <SheetTitle className="sr-only">Cargando booking</SheetTitle>
          </SheetHeader>

          <p className="text-sm text-muted-foreground p-6">Cargando booking…</p>
        </SheetContent>
      </Sheet>
    );
  }

  /* ============================
     Not found
  ============================ */
  if (notFound) {
    return (
      <Sheet open={open} onOpenChange={(o) => !o && closeAppointment()}>
        <SheetContent side="right" className="w-full !max-w-[30rem]">
          <SheetHeader>
            <SheetTitle className="sr-only">Booking no encontrado</SheetTitle>
          </SheetHeader>

          <div className="p-6 space-y-2">
            <h3 className="font-semibold text-base">
              Esta cita no pertenece a un booking
            </h3>
            <p className="text-sm text-muted-foreground">
              Puede tratarse de una cita antigua o creada sin flujo de booking.
            </p>

            <Button
              variant="outline"
              className="mt-4"
              onClick={closeAppointment}
            >
              Cerrar
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  /* ============================
     Booking UI
  ============================ */
  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeAppointment()}>
      <SheetContent
        side="right"
        className="w-full !max-w-[30rem] flex flex-col bg-white"
      >
        <SheetHeader>
          <SheetTitle className="sr-only">Detalle del booking</SheetTitle>
        </SheetHeader>

        {/* HEADER */}
        <BookingHeader
          booking={booking}
          orgId={branch.organizationId}
          onAssignClient={async (clientId) => {
            await assignClientToBooking({
              bookingId: booking.id,
              clientId,
            });

            const res = await getManagerBookingById(booking.id);
            setBooking(res.booking);
            showAlert(
              buildBookingClientAssignedAlert({
                clientName: res.booking.client?.name,
                startIso: res.booking.startsAtISO,
              })
            );
          }}
        />

        {/* BODY */}
        <div className="flex flex-col gap-6 flex-1 overflow-y-auto px-5 py-4">
          <div>
            <span
              className={cn(
                "px-4 py-2 text-sm rounded-full",
                statusUI.className
              )}
            >
              {statusUI.label}
            </span>
          </div>

          <div className="space-y-4">
            {booking.appointments.map((a: any, i: number) => {
              const s = DateTime.fromISO(a.startIso).toLocal();

              return (
                <div key={a.id} className="border rounded-md p-4 space-y-1">
                  <div className="font-medium">
                    {i + 1}. {a.service.name}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {s.toFormat("t")} • {a.durationMin} min • {a.staff.name}
                  </div>

                  <div className="text-sm font-medium">
                    ${(a.priceCents / 100).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex-1" />

          {/* ACTIONS */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-base">Total</span>
              <span className="font-semibold text-base">
                ${(booking.totalCents / 100).toFixed(2)}
              </span>
            </div>

            <div className="flex gap-2">
              {booking.status === "CONFIRMED" && (
                <>
                  <CancelBookingButton
                    bookingId={booking.id}
                    clientName={clientName}
                    startIso={firstAppointment.startIso}
                  />

                  <Button
                    variant="outline"
                    className="h-12 w-12"
                    tooltip="Reagendar"
                  >
                    <CalendarSync className="h-4 w-4" />
                  </Button>
                </>
              )}

              <Button className="flex-1 py-6">Pagar</Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
