import { AvailableDate, AvailableTime, publicFetch } from "./apiPublic";

export function getPublicAvailableDates({
  slug,
  requiredDurationMin,
  staffId,
  month,
}: {
  slug: string;
  requiredDurationMin: number;
  staffId?: string;
  month?: string; // YYYY-MM
}): Promise<AvailableDate[]> {
  const params = new URLSearchParams({
    requiredDurationMin: String(requiredDurationMin),
  });

  if (staffId) params.append("staffId", staffId);
  if (month) params.append("month", month);

  return publicFetch(
    `/public/${slug}/availability/dates?${params.toString()}`
  );
}

export function getPublicAvailableTimes({
  slug,
  serviceId,
  date,
  staffId,
}: {
  slug: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  staffId?: string;
}): Promise<AvailableTime[]> {
  const params = new URLSearchParams({
    serviceId,
    date,
  });

  if (staffId) params.append("staffId", staffId);

  return publicFetch(
    `/public/${slug}/availability/times?${params.toString()}`
  );
}

export type AvailabilityChainRequest = {
  date: string; // YYYY-MM-DD
  chain: {
    serviceId: string;
    staffId: string | "ANY";
  }[];
};

export type AvailabilityChainAssignment = {
  serviceId: string;
  staffId: string;
  startIso: string; // UTC ISO
  endIso: string; // UTC ISO
  durationMin: number;

  startLocalIso?: string;
  endLocalIso?: string;
};

export type AvailabilityChainPlan = {
  startIso: string;

  startLocalIso?: string;
  startLocalLabel?: string;

  assignments: AvailabilityChainAssignment[];
};

/* =====================
   API CALL
===================== */

export async function getAvailabilityChain(params: {
  slug: string;
  body: AvailabilityChainRequest;
}): Promise<AvailabilityChainPlan[]> {
  const { slug, body } = params;

  return publicFetch<AvailabilityChainPlan[]>(
    `/public/${slug}/availability/chain`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}