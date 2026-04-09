import { api } from "./api";
import { buildDedupKey, runDeduped, stableStringify } from "./request-dedupe";

const AVAILABILITY_RESULT_CACHE_MS = 1000;

export async function getAvailability<T = unknown>(params: {
  branchId: string;
  serviceId: string;
  date: string;
  staffId?: string;
}): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = new URLSearchParams(params as any).toString();

  const path = `/availability?${query}`;

  return runDeduped(
    buildDedupKey("GET", path),
    () => api<T>(path),
    { cacheTtlMs: AVAILABILITY_RESULT_CACHE_MS },
  );
}

export async function getAvailableServicesForSlot<T = unknown>(params: {
  branchId: string;
  staffId: string;
  datetime: string; // ISO
}): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = new URLSearchParams(params as any).toString();

  const path = `/availability/available-services?${query}`;

  return runDeduped(
    buildDedupKey("GET", path),
    () => api<T>(path),
    { cacheTtlMs: AVAILABILITY_RESULT_CACHE_MS },
  );
}

export async function getAvailableServicesAt<T>(params: {
  branchId: string;
  datetime: string;
}): Promise<T> {
  const path = "/availability/available-services-at";
  const body = {
    branchId: params.branchId,
    datetime: params.datetime,
  };

  return runDeduped(
    buildDedupKey("POST", path, body),
    () =>
      api<T>(path, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    { cacheTtlMs: AVAILABILITY_RESULT_CACHE_MS },
  );
}

export type ManagerAvailabilityChainRequest = {
  date: string; // YYYY-MM-DD
  chain: { serviceId: string; staffId: string | "ANY" }[];
};

export type AvailabilityChainRequest = AvailabilityChainRequestBody;

export type ManagerAvailabilityChainPlan = {
  startIso: string; // UTC ISO
  startLocalIso: string; // ISO en TZ local branch
  startLocalLabel: string; // "HH:mm"
  assignments: {
    serviceId: string;
    staffId: string;

    startIso: string; // UTC ISO
    endIso: string; // UTC ISO

    startLocalIso: string;
    endLocalIso: string;

    durationMin: number;
  }[];
};

export type AvailabilityChainRequestBody = {
  date: string; // YYYY-MM-DD
  chain: { serviceId: string; staffId: string | "ANY" }[];
};

export type AvailabilityChainAssignment = {
  serviceId: string;
  staffId: string;

  // UTC (source of truth)
  startIso: string;
  endIso: string;

  // Local timezone (for UI)
  startLocalIso: string;
  endLocalIso: string;

  durationMin: number;
};

export type AvailabilityChainPlan = {
  // UTC (source of truth)
  startIso: string;

  // Local timezone (for UI)
  startLocalIso: string;
  startLocalLabel: string; // "08:00"

  assignments: AvailabilityChainAssignment[];
};

export async function getManagerAvailabilityChain(params: {
  branchId: string;
  body: AvailabilityChainRequestBody;
}): Promise<AvailabilityChainPlan[]> {
  const { branchId, body } = params;

  if (!branchId) throw new Error("Missing branchId");
  if (!body?.date) throw new Error("Missing body.date");
  if (!Array.isArray(body.chain) || body.chain.length === 0) {
    throw new Error("Missing body.chain");
  }

  const path = `/availability/${branchId}/chain`;
  const normalizedBody = stableStringify(body);

  return runDeduped(
    buildDedupKey("POST", path, normalizedBody),
    () =>
      api<AvailabilityChainPlan[]>(path, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    { cacheTtlMs: AVAILABILITY_RESULT_CACHE_MS },
  );
}

export const getAvailabilityChainManager = getManagerAvailabilityChain;
