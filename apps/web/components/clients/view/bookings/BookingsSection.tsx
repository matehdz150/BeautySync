"use client";

import { useMemo, useState } from "react";
import BookingsFilters from "./BookingsFilters";
import BookingsTimeline from "./BookingsTimeline";

type StatusFilter =
  | "ALL"
  | "COMPLETED"
  | "CONFIRMED"
  | "CANCELLED"
  | "PAYED";

export default function BookingsSection({ bookings }: any) {
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const sortedBookings = useMemo(() => {
    return [...bookings].sort(
      (a, b) =>
        new Date(b.startsAt).getTime() -
        new Date(a.startsAt).getTime()
    );
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    if (statusFilter === "ALL") return sortedBookings;

    return sortedBookings.filter(
      (b) => b.status === statusFilter
    );
  }, [sortedBookings, statusFilter]);

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">
        Historial de citas
      </h2>

      <BookingsFilters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <BookingsTimeline bookings={filteredBookings} />
    </section>
  );
}