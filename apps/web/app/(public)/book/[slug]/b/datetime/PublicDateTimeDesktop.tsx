"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DatePicker } from "@/components/book/DatePicker";
import { TimeSlots } from "@/components/book/TimesSlot";
import { CalendarPopover } from "@/components/book/CalendarPopover";
import { useAvailability } from "@/context/AvailabilityContext";
import { PublicService, usePublicBooking } from "@/context/PublicBookingContext";
import { motion } from "framer-motion";

function getTotalDurationMin(services: string[], catalog: PublicService[]): number {
  return services.reduce((total, serviceId) => {
    const srv = catalog.find((s) => s.id === serviceId);
    return total + (srv?.durationMin ?? 0);
  }, 0);
}

export function PublicDateTimeDesktop() {
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
        payload: null as any,
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
    <div className="space-y-6">
      {/* glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -top-60 h-125 w-255 -translate-x-1/2 z-0 rounded-full blur-3xl
             bg-gradient-to-b from-indigo-400/75 via-indigo-400/10 to-transparent"
        initial={{ opacity: 0, scale: 0.92, filter: "blur(90px)" }}
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

      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Fecha y hora</h1>
          <p className="text-sm text-muted-foreground leading-snug">
            Elige el día y la hora de tu cita
          </p>
        </div>

        <CalendarPopover selectedDate={selectedDate} onSelect={handleSelectDate} />
      </div>

      {/* content */}
      <div className="space-y-4">
        <DatePicker
          branchSlug={booking.branch!.slug}
          requiredDurationMin={requiredDurationMin}
          selectedDate={selectedDate}
          onSelect={handleSelectDate}
        />

        <div className="pt-2">
          <TimeSlots />
        </div>
      </div>
    </div>
  );
}