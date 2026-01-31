// lib/ui/bookingAlerts.ts
import { DateTime } from "luxon";

type BookingSuccessAlertParams = {
  clientName?: string | null;
  startIso: string; // UTC ISO
};

export function buildBookingSuccessAlert({
  clientName,
  startIso,
}: BookingSuccessAlertParams) {
  const time = DateTime.fromISO(startIso)
    .toLocal()
    .toFormat("HH:mm");

  return {
    type: "success" as const,
    title: "Cita creada exitosamente",
    description: `${clientName ?? "Cliente"} • ${time}`,
    autoCloseMs: 3000,
  };
}

export function buildBookingClientAssignedAlert({
  clientName,
  startIso,
}: {
  clientName?: string | null;
  startIso: string;
}) {
  const time = DateTime.fromISO(startIso)
    .toLocal()
    .toFormat("HH:mm");

  return {
    type: "success" as const,
    title: "Cliente asignado",
    description: `${clientName ?? "Cliente"} • ${time}`,
    autoCloseMs: 2500,
  };
}

export function buildBookingCancelledAlert({
  clientName,
  startIso,
}: {
  clientName?: string | null;
  startIso: string;
}) {
  const time = DateTime.fromISO(startIso)
    .toLocal()
    .toFormat("HH:mm");

  return {
    type: "success" as const,
    title: "Cita cancelada",
    description: `${clientName ?? "Cliente"} • ${time}`,
    autoCloseMs: 3000,
  };
}