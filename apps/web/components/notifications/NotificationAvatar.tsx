"use client";

import {
  Notification,
  BookingNotificationPayload,
} from "@/lib/services/notifications";
import {
  CalendarDays,
  XCircle,
  RefreshCw,
  MessageCircle,
} from "lucide-react";

function isBookingCreatedNotification(
  notification: Notification,
): notification is Notification & {
  kind: "BOOKING_CREATED";
  payload: BookingNotificationPayload;
} {
  const p = notification.payload as Partial<BookingNotificationPayload>;

  return (
    notification.kind === "BOOKING_CREATED" &&
    typeof p === "object" &&
    p !== null &&
    Array.isArray(p.services)
  );
}

export function NotificationAvatar({
  notification,
}: {
  notification: Notification;
}) {
  if (isBookingCreatedNotification(notification)) {
    const client = notification.payload.client;

    if (client?.avatarUrl) {
      return (
        <img
          src={client.avatarUrl}
          alt={client.name ?? "Cliente"}
          className="h-8 w-8 rounded-full object-cover shrink-0"
        />
      );
    }

    return (
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
        {client?.name?.charAt(0) ?? "C"}
      </div>
    );
  }

  const iconClass = "h-4 w-4";

  switch (notification.kind) {
    case "BOOKING_CANCELLED":
      return (
        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <XCircle className={`${iconClass} text-red-600`} />
        </div>
      );

    case "BOOKING_RESCHEDULED":
      return (
        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <RefreshCw className={`${iconClass} text-amber-600`} />
        </div>
      );

    case "CHAT_MESSAGE":
      return (
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <MessageCircle className={`${iconClass} text-blue-600`} />
        </div>
      );

    default:
      return (
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <CalendarDays className={iconClass} />
        </div>
      );
  }
}