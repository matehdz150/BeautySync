import { DateTime } from "luxon";

export function getBusyRangesForDay(services: any[], dayISO: string) {
  return services
    .filter(s => s.startISO)
    .map(s => {
      const start = DateTime.fromISO(s.startISO);
      const end = start.plus({ minutes: s.service.durationMin });
      return { start, end };
    })
    .filter(r => r.start.toISODate() === dayISO);
}

export function overlaps(start: any, end: any, busy: any[]) {
  return busy.some(r =>
    start < r.end && end > r.start
  );
}