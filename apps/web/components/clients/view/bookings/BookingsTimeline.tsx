"use client";

import { useMemo } from "react";
import BookingMonthGroup from "./BookingMonthGroup";

interface Props {
  bookings: any[];
}

export default function BookingsTimeline({ bookings }: Props) {
  const bookingsByMonth = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    bookings.forEach((b) => {
      const date = new Date(b.startsAt);

      const monthKey = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }

      grouped[monthKey].push(b);
    });

    return grouped;
  }, [bookings]);

  if (bookings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay citas para este filtro
      </p>
    );
  }

  return (
    <div className="relative pl-16">
      <div className="absolute left-7 top-0 bottom-0 w-[2px] bg-gray-300" />

      {Object.entries(bookingsByMonth).map(([month, monthBookings]) => (
        <BookingMonthGroup
          key={month}
          month={month}
          bookings={monthBookings}
        />
      ))}
    </div>
  );
}