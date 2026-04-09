import { api } from "./api";
import { buildDedupKey, runDeduped } from "./request-dedupe";

export type CalendarAppointment = {
  id: string;
  staffId: string;

  start: string;
  end: string;

  clientName: string;
  serviceName: string;
  color?: string;
};

export type CalendarTimeOff = {
  id: number;
  staffId: string;

  start: string;
  end: string;

  reason?: string;
};

export type GetCalendarDayResponse = {
  date: string;
  timezone: string;

  appointments: CalendarAppointment[];
  timeOffs: CalendarTimeOff[];

  meta: {
    totalAppointments: number;
    totalTimeOffs: number;
  };
};

export type GetCalendarWeekSummaryResponse = {
  date: string;
  timezone: string;
  days: Array<{
    date: string;
    totalAppointments: number;
  }>;
};

type GetCalendarDayParams = {
  branchId: string;
  date: string; // YYYY-MM-DD
  staffId?: string;
};

type GetCalendarWeekSummaryParams = GetCalendarDayParams;

type CalendarRequestOptions = {
  signal?: AbortSignal;
};

export async function getCalendarDay(
  params: GetCalendarDayParams,
  options?: CalendarRequestOptions,
) {
  const query = new URLSearchParams({
    branchId: params.branchId,
    date: params.date,
    ...(params.staffId ? { staffId: params.staffId } : {}),
  });

  const path = `/calendar/day?${query.toString()}`;

  if (options?.signal) {
    return api<GetCalendarDayResponse>(path, { signal: options.signal });
  }

  return runDeduped(
    buildDedupKey("GET", path),
    () => api<GetCalendarDayResponse>(path),
  );
}

export async function getCalendarWeekSummary(
  params: GetCalendarWeekSummaryParams,
  options?: CalendarRequestOptions,
) {
  const query = new URLSearchParams({
    branchId: params.branchId,
    date: params.date,
    ...(params.staffId ? { staffId: params.staffId } : {}),
  });

  const path = `/calendar/week-summary?${query.toString()}`;

  if (options?.signal) {
    return api<GetCalendarWeekSummaryResponse>(path, { signal: options.signal });
  }

  return runDeduped(
    buildDedupKey("GET", path),
    () => api<GetCalendarWeekSummaryResponse>(path),
  );
}
