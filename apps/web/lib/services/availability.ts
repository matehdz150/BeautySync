import { api } from "./api";

export async function getAvailability(params: {
  branchId: string;
  serviceId: string;
  date: string;
  staffId?: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = new URLSearchParams(params as any).toString();

  return api(`/availability?${query}`);
}

export async function getAvailableServicesForSlot(params: {
  branchId: string;
  staffId: string;
  datetime: string; // ISO
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = new URLSearchParams(params as any).toString();

  return api(`/availability/available-services?${query}`);
}

export type ManagerAvailabilityChainRequest = {
  date: string; // YYYY-MM-DD
  chain: { serviceId: string; staffId: string | "ANY" }[];
};

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

  return api<AvailabilityChainPlan[]>(`/availability/${branchId}/chain`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}