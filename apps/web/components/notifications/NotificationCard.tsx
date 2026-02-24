"use client";

import { useRouter, useParams } from "next/navigation";
import {
  Notification,
  BookingNotificationPayload,
  markNotificationAsRead,
} from "@/lib/services/notifications";
import { NotificationAvatar } from "./NotificationAvatar";
import { formatTime, getPreview, getSenderName } from "./notification-helpers";
import { useNotifications } from "@/context/NotificationsContext";

interface Props {
  notification: Notification;
}

function isBookingNotification(
  notification: Notification,
): notification is Notification & {
  payload: BookingNotificationPayload;
} {
  const p = notification.payload as Partial<BookingNotificationPayload>;

  return (
    ["BOOKING_CREATED", "BOOKING_CANCELLED", "BOOKING_RESCHEDULED"].includes(
      notification.kind,
    ) &&
    typeof p === "object" &&
    p !== null &&
    Array.isArray(p.services)
  );
}

export function NotificationCard({ notification }: Props) {
  const router = useRouter();
  const params = useParams();
  const { markAsReadLocal } = useNotifications();

  // ⚠️ Asegúrate que tu carpeta sea:
  // app/inbox/main/[notificationId]/page.tsx
  const currentId = params?.notificationId as string | undefined;

  const selected = currentId === notification.id;
  const unread = !notification.readAt;

  const handleClick = async () => {
    if (selected) return;

    // 🧠 optimistic update
    if (!notification.readAt) {
      markAsReadLocal(notification.id);

      // backend async (no bloquea UI)
      markNotificationAsRead(notification.id).catch(() => {
        // opcional: podrías revertir
        console.warn("Failed to mark notification as read");
      });
    }

    router.push(`/dashboard/inbox/main/${notification.id}`, { scroll: false });
  };

  return (
    <div
      onClick={handleClick}
      className={`
        mx-4 my-3
        h-[88px]
        rounded-2xl
        px-5 py-4
        flex items-center
        transition-all duration-200
        cursor-pointer border
        ${
          selected
            ? "bg-blue-100 border-blue-200"
            : "bg-transparent hover:bg-muted/60 border-border"
        }
      `}
    >
      <div className="flex w-full items-start justify-between gap-4">
        <div className="flex gap-3 min-w-0">
          {/* 🔵 Unread dot */}
          {unread && (
            <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
          )}

          {/* Avatar */}
          <NotificationAvatar notification={notification} />

          {/* Text */}
          <div className="flex flex-col gap-[2px] min-w-0">
            {/* Línea 1 → QUIÉN */}
            <div
              className={`text-sm truncate leading-tight ${
                unread ? "font-semibold" : "font-medium"
              }`}
            >
              {getSenderName(notification)}
            </div>

            {/* Línea 2 → QUÉ PASÓ */}
            <div
              className={`text-sm truncate leading-tight ${
                unread ? "font-medium text-foreground" : "text-muted-foreground"
              }`}
            >
              {getSubject(notification.kind)}
            </div>

            {/* Línea 3 → DETALLE */}
            {notification.kind !== "CHAT_MESSAGE" && (
              <div className="text-xs text-muted-foreground truncate">
                {getPreview(notification)}
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground shrink-0 pt-0.5">
          {formatTime(notification.createdAt)}
        </div>
      </div>
    </div>
  );
}

export function getSubject(kind: Notification["kind"]) {
  switch (kind) {
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
