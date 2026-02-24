import {
  Notification,
  BookingNotificationPayload,
} from "@/lib/services/notifications";

function isBooking(notification: Notification) {
  return [
    "BOOKING_CREATED",
    "BOOKING_CANCELLED",
    "BOOKING_RESCHEDULED",
  ].includes(notification.kind);
}

export function getSenderName(notification: Notification) {
  if (isBooking(notification)) {
    const p = notification.payload as BookingNotificationPayload;
    return p.client?.name ?? "Cliente";
  }

  if (isChat(notification)) {
    const p = notification.payload as any;
    return p.sender?.name ?? "Nuevo mensaje";
  }

  return "Sistema";
}

export function isChat(notification: Notification) {
  return notification.kind === "CHAT_MESSAGE";
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

    const services =
      p.services?.map((s) => s.name).join(", ") ?? "Actividad";

    const starts = p.schedule?.startsAt
      ? new Date(p.schedule.startsAt)
      : null;

    const total =
      p.meta?.totalCents != null
        ? p.meta.totalCents / 100
        : null;

    return [
      services,
      starts &&
        `${starts.toLocaleDateString()} ${starts.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
      total !== null && `$${total.toLocaleString()}`,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  if (isChat(notification)) {
    const p = notification.payload as any;
    return p.preview ?? "Nuevo mensaje";
  }

  return "Nueva actividad";
}

export function formatTime(date: string) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) return "Ahora";
  if (hours < 24) return `${hours}h`;

  return d.toLocaleDateString();
}