"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCalendar, useCalendarActions } from "@/context/CalendarContext";
import { DateTime } from "luxon";
import { cn } from "@/lib/utils";
import { ChevronDown, RefreshCwOff, CalendarSync } from "lucide-react";
import { getManagerBookingById } from "@/lib/services/appointments";

export default function AppointmentDetailSheet() {
  const { state } = useCalendar();
  const { closeAppointment } = useCalendarActions();

  const appointment = state.appointments.find(
    (a: any) => a.id === state.selectedAppointmentId
  );
  const bookingId: string | null = appointment?.bookingId ?? null;

  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  console.log(bookingId);

  const open = !!appointment;

  /* ============================
     Load booking by bookingId
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
        console.log(res);

        if (!cancelled) {
          setBooking(res.booking);
        }
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

  /* ============================
     EMPTY / LOADING STATES
  ============================ */
  if (loading) {
    return (
      <Sheet open={open} onOpenChange={(o) => !o && closeAppointment()}>
        <SheetContent side="right" className="w-full !max-w-[30rem]">
          <p className="text-sm text-muted-foreground p-6">Cargando booking…</p>
        </SheetContent>
      </Sheet>
    );
  }

  if (notFound) {
    return (
      <Sheet open={open} onOpenChange={(o) => !o && closeAppointment()}>
        <SheetContent side="right" className="w-full !max-w-[30rem]">
          <SheetHeader>
            <SheetTitle>;</SheetTitle>
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

  if (!booking) return null;

  const start = DateTime.fromISO(booking.startsAtISO).toLocal();

  /* ============================
     BOOKING UI
  ============================ */
  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeAppointment()}>
      <SheetContent
        side="right"
        className={cn("w-full !max-w-[30rem] flex flex-col bg-white")}
      >
        <div className="flex h-full">
          <div className="flex-1 flex flex-col">
            {/* HEADER */}
            <SheetHeader className="text-left px-5 py-8 bg-indigo-400">
              <SheetTitle className="text-white">
                {booking.client?.name ?? "Cliente"}
              </SheetTitle>

              <SheetDescription className="text-white flex items-center justify-between">
                {start.toFormat("ccc d LLL")} • {start.toFormat("t")}
                <Button variant="outline" className="bg-transparent">
                  Ver cliente
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </SheetDescription>
            </SheetHeader>

            {/* BODY */}
            <div className="flex flex-col gap-6 flex-1 overflow-y-auto px-5 py-4">
              {/* STATUS */}
              <div>
                <span className="px-4 py-2 text-sm rounded-full bg-indigo-50 text-indigo-700">
                  Booking confirmado
                </span>
              </div>

              {/* SERVICES */}
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

              {/* FOOTER ACTIONS */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-base">Total</span>
                  <span className="font-semibold text-base">
                    ${(booking.totalCents / 100).toFixed(2)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <RefreshCwOff className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>

                  <Button variant="outline" className="flex-1">
                    <CalendarSync className="mr-2 h-4 w-4" />
                    Reagendar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
