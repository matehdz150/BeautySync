import {
  Notification,
  BookingNotificationPayload,
} from "@/lib/services/notifications";

function isBooking(notification: Notification) {
  return notification.kind === "BOOKING_CREATED";
}

export function getSenderName(notification: Notification) {
  if (isBooking(notification)) {
    const p = notification.payload as BookingNotificationPayload;
    return p.client?.name ?? "Nuevo booking";
  }

  return "Sistema";
}

export function getSubject(notification: Notification) {
  switch (notification.kind) {
    case "BOOKING_CREATED":
      return "Nueva cita creada";
    case "BOOKING_CANCELLED":
      return "Cita cancelada";
    case "BOOKING_RESCHEDULED":
      return "Cita reagendada";
    case "CHAT_MESSAGE":
      return "Nuevo mensaje";
    default:
      return "Notificación";
  }
}

export function getPreview(notification: Notification) {
  if (isBooking(notification)) {
    const p = notification.payload as BookingNotificationPayload;
    return p.services?.length
      ? p.services.map((s) => s.name).join(", ")
      : "Nueva cita registrada";
  }

  return "Nueva actividad en tu cuenta";
}

export function formatTime(date: string) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) return "Ahora";
  if (hours < 24) return `${hours}h`;

  return d.toLocaleDateString();
}