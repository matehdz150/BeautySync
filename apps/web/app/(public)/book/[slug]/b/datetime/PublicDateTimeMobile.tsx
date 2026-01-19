"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DatePicker } from "@/components/book/DatePicker";
import { CalendarPopover } from "@/components/book/CalendarPopover";
import { TimeSlotsMobile } from "@/components/book/TimeSlotsMobile";
import { useAvailability } from "@/context/AvailabilityContext";
import { PublicService, usePublicBooking } from "@/context/PublicBookingContext";
import { DatePickerMobile } from "@/components/book/DatePickerMobile";

function getTotalDurationMin(services: string[], catalog: PublicService[]): number {
  return services.reduce((total, serviceId) => {
    const srv = catalog.find((s) => s.id === serviceId);
    return total + (srv?.durationMin ?? 0);
  }, 0);
}

export default function PublicDateTimeMobilePage() {
  const availability = useAvailability();
  const booking = usePublicBooking();

  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const handleSelectDate = useCallback(
    (iso: string) => {
      setSelectedDate((prev) => (prev === iso ? prev : iso));

      booking.dispatch({ type: "SET_DATE", payload: iso });

      booking.dispatch({
        type: "SET_TIME",
        payload: null as any, // reset time
      });
    },
    [booking]
  );

  useEffect(() => {
    if (!selectedDate) return;
    availability.fetchAvailableTimesForDate(selectedDate);
  }, [selectedDate, availability.fetchAvailableTimesForDate]);

  const requiredDurationMin = useMemo(() => {
    return getTotalDurationMin(booking.services, booking.catalog);
  }, [booking.services, booking.catalog]);

  return (
    <div className="relative min-h-dvh bg-white overflow-hidden">
      {/* glow (sin animación) */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -top-44 h-20 w-20 -translate-x-1/2 rounded-full blur-3xl
        bg-gradient-to-b from-indigo-400/40 via-indigo-400/15 to-transparent"
      />

      {/* HEADER sticky */}
      <div className="sticky top-0 z-40 bg-white/92 backdrop-blur-md border-b border-black/5">
        <div className="px-4 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold leading-tight truncate">
              Fecha y hora
            </h1>
            <p className="text-xs text-muted-foreground leading-snug">
              Elige el día y la hora de tu cita
            </p>
          </div>

          <div className="shrink-0">
            <CalendarPopover selectedDate={selectedDate} onSelect={handleSelectDate} />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-4 pt-4 pb-28 space-y-5">
        <DatePickerMobile
          branchSlug={booking.branch!.slug}
          requiredDurationMin={requiredDurationMin}
          selectedDate={selectedDate}
          onSelect={handleSelectDate}
        />

        <TimeSlotsMobile />
      </div>
    </div>
  );
}