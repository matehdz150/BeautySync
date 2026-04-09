"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  getMyPublicAppointments,
  type GetMyPublicAppointmentsQuery,
  type PublicAppointmentsListResponse,
} from "@/lib/services/public/me/appointments";
import { buildDedupKey, cachedRequest } from "@/lib/services/request-dedupe";

type AppointmentsSnapshot = {
  data: PublicAppointmentsListResponse | null;
  loading: boolean;
  error: string | null;
  updatedAt: number | null;
};

const APPOINTMENTS_TTL_MS = 2_000;

const stateByKey = new Map<string, AppointmentsSnapshot>();
const inFlightByKey = new Map<string, Promise<void>>();
const listenersByKey = new Map<string, Set<() => void>>();
const DEFAULT_APPOINTMENTS_SNAPSHOT: AppointmentsSnapshot = {
  data: null,
  loading: false,
  error: null,
  updatedAt: null,
};

function defaultSnapshot(): AppointmentsSnapshot {
  return DEFAULT_APPOINTMENTS_SNAPSHOT;
}

function queryKey(query?: GetMyPublicAppointmentsQuery) {
  return buildDedupKey("GET", "/public/appointments/me", query ?? {});
}

function emit(key: string) {
  const listeners = listenersByKey.get(key);
  if (!listeners) return;
  listeners.forEach((listener) => listener());
}

function getSnapshot(key: string): AppointmentsSnapshot {
  return stateByKey.get(key) ?? defaultSnapshot();
}

function setSnapshot(key: string, patch: Partial<AppointmentsSnapshot>) {
  const prev = getSnapshot(key);
  stateByKey.set(key, { ...prev, ...patch });
  emit(key);
}

function subscribe(key: string, listener: () => void) {
  const listeners = listenersByKey.get(key) ?? new Set<() => void>();
  listeners.add(listener);
  listenersByKey.set(key, listeners);

  return () => {
    const set = listenersByKey.get(key);
    if (!set) return;
    set.delete(listener);
    if (set.size === 0) {
      listenersByKey.delete(key);
    }
  };
}

async function load(
  key: string,
  query?: GetMyPublicAppointmentsQuery,
  options?: { force?: boolean }
) {
  const force = options?.force ?? false;
  const existing = inFlightByKey.get(key);
  if (existing && !force) {
    return existing;
  }

  const current = getSnapshot(key);
  if (!current.loading) {
    setSnapshot(key, { loading: true, error: null });
  }

  const promise = cachedRequest(
    key,
    () => getMyPublicAppointments(query),
    APPOINTMENTS_TTL_MS
  )
    .then((data) => {
      setSnapshot(key, {
        data,
        loading: false,
        error: null,
        updatedAt: Date.now(),
      });
    })
    .catch((error: unknown) => {
      setSnapshot(key, {
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed loading appointments",
      });
    })
    .finally(() => {
      inFlightByKey.delete(key);
    });

  inFlightByKey.set(key, promise);
  return promise;
}

export function invalidateMyAppointments(query?: GetMyPublicAppointmentsQuery) {
  const key = queryKey(query);
  stateByKey.delete(key);
  inFlightByKey.delete(key);
  emit(key);
}

export function useMyAppointments(query?: GetMyPublicAppointmentsQuery) {
  const key = queryKey(query);
  const snapshot = useSyncExternalStore(
    (listener) => subscribe(key, listener),
    () => getSnapshot(key),
    () => getSnapshot(key)
  );

  useEffect(() => {
    const current = getSnapshot(key);
    if (current.loading || current.data) return;
    void load(key, query);
  }, [key, query]);

  const actions = useMemo(
    () => ({
      refresh: async () => {
        await load(key, query, { force: true });
      },
    }),
    [key, query]
  );

  return {
    ...snapshot,
    ...actions,
  };
}
