import { api } from "./api";

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

type GetCalendarDayParams = {
  branchId: string;
  date: string; // YYYY-MM-DD
  staffId?: string;
};

export async function getCalendarDay(params: GetCalendarDayParams) {
  const query = new URLSearchParams({
    branchId: params.branchId,
    date: params.date,
    ...(params.staffId ? { staffId: params.staffId } : {}),
  });

  return api<GetCalendarDayResponse>(`/calendar/day?${query.toString()}`);
}