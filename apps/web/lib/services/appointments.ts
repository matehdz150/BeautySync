import { DateTime } from "luxon";
import { api } from "./api";

export async function createAppointment(input: {
  branchId: string;
  serviceId: string;
  staffId: string;
  clientId?: string;
  start: string;      // ISO string
  notes?: string;
}) {
  return api("/appointments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function rescheduleAppointment(
  id: string,
  date: string,
  time: string,
  staffId?: string
) {
  const iso = DateTime
    .fromISO(`${date}T${time}`, { zone: "America/Mexico_City" })
    .toUTC()
    .toISO();

  return api(`/appointments/${id}/reschedule`, {
    method: "PATCH",
    body: JSON.stringify({ start: iso, staffId }),
  });
}

export async function getAppointmentsByDay(params: {
  branchId: string;
  date: string; // YYYY-MM-DD LOCAL
  staffId?: string;
}) {
  return api<{
    total: number;
    data: Array<{
      id: string;
      start: string;
      end: string;
      service: { name: string, categoryColor?: string, categoryIcon?: string };
      client: { name: string };
      staff: { id: string; name: string };
    }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }>(`/appointments?${new URLSearchParams(params as any)}`);
}

export async function getAppointmentById(id: string) {
  if (!id) {
    throw new Error("appointment id is required");
  }

  return api<{
    id: string;
    start: string;
    end: string;
    status: string;
    priceCents: number;

    service: {
      id: string;
      name: string;
      durationMin: number;
      categoryColor?: string;
      categoryIcon?: string;
    };

    client?: {
      id: string;
      name: string;
      email?: string;
    } | null;

    staff: {
      id: string;
      name: string;
    };
  }>(`/appointments/${id}`);
}