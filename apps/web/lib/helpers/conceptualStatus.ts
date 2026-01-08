import { DateTime } from "luxon";

export function getConceptualStatus(startISO: string, endISO: string) {
  const now = DateTime.now();
  const start = DateTime.fromISO(startISO);
  const end = DateTime.fromISO(endISO);

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "ongoing";
  return "past";
}