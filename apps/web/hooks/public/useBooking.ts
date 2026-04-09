"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  getMyPublicBookingById,
  type PublicBookingDetailResponse,
} from "@/lib/services/public/me/appointments";
import { buildDedupKey, cachedRequest } from "@/lib/services/request-dedupe";

type BookingSnapshot = {
  data: PublicBookingDetailResponse | null;
  loading: boolean;
  error: string | null;
  updatedAt: number | null;
};

const BOOKING_TTL_MS = 2_000;

const bookingState = new Map<string, BookingSnapshot>();
const bookingInFlight = new Map<string, Promise<void>>();
const bookingListeners = new Map<string, Set<() => void>>();
const DEFAULT_BOOKING_SNAPSHOT: BookingSnapshot = {
  data: null,
  loading: false,
  error: null,
  updatedAt: null,
};

function getDefaultSnapshot(): BookingSnapshot {
  return DEFAULT_BOOKING_SNAPSHOT;
}

function emit(bookingId: string) {
  const listeners = bookingListeners.get(bookingId);
  if (!listeners) return;
  listeners.forEach((listener) => listener());
}

function setSnapshot(bookingId: string, patch: Partial<BookingSnapshot>) {
  const prev = bookingState.get(bookingId) ?? getDefaultSnapshot();
  bookingState.set(bookingId, { ...prev, ...patch });
  emit(bookingId);
}

function getSnapshotById(bookingId: string): BookingSnapshot {
  return bookingState.get(bookingId) ?? getDefaultSnapshot();
}

function subscribeById(bookingId: string, listener: () => void) {
  const listeners = bookingListeners.get(bookingId) ?? new Set<() => void>();
  listeners.add(listener);
  bookingListeners.set(bookingId, listeners);

  return () => {
    const set = bookingListeners.get(bookingId);
    if (!set) return;
    set.delete(listener);
    if (set.size === 0) {
      bookingListeners.delete(bookingId);
    }
  };
}

async function loadBooking(
  bookingId: string,
  options?: { force?: boolean }
): Promise<void> {
  const force = options?.force ?? false;
  const existing = bookingInFlight.get(bookingId);
  if (existing && !force) {
    return existing;
  }

  const current = getSnapshotById(bookingId);
  if (!current.loading) {
    setSnapshot(bookingId, { loading: true, error: null });
  }

  const requestPath = `/public/booking/bookings/${bookingId}`;
  const requestKey = buildDedupKey("GET", requestPath);

  const promise = cachedRequest(
    requestKey,
    () => getMyPublicBookingById(bookingId),
    BOOKING_TTL_MS
  )
    .then((data) => {
      setSnapshot(bookingId, {
        data,
        loading: false,
        error: null,
        updatedAt: Date.now(),
      });
    })
    .catch((error: unknown) => {
      setSnapshot(bookingId, {
        loading: false,
        error: error instanceof Error ? error.message : "Failed loading booking",
      });
    })
    .finally(() => {
      bookingInFlight.delete(bookingId);
    });

  bookingInFlight.set(bookingId, promise);
  return promise;
}

export function invalidateBooking(bookingId: string) {
  bookingState.delete(bookingId);
  bookingInFlight.delete(bookingId);
  emit(bookingId);
}

export function useBooking(bookingId: string | null | undefined) {
  const stableId = bookingId ?? "";

  const snapshot = useSyncExternalStore(
    (listener) => subscribeById(stableId, listener),
    () => getSnapshotById(stableId),
    () => getSnapshotById(stableId)
  );

  useEffect(() => {
    if (!stableId) return;
    const current = getSnapshotById(stableId);
    if (current.loading || current.data) return;
    void loadBooking(stableId);
  }, [stableId]);

  const actions = useMemo(
    () => ({
      refresh: async () => {
        if (!stableId) return;
        await loadBooking(stableId, { force: true });
      },
    }),
    [stableId]
  );

  return {
    ...snapshot,
    ...actions,
  };
}
