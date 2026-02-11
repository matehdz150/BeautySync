"use client";

import { useEffect, useState } from "react";
import {
  getMyNotifications,
  Notification,
  BookingNotificationPayload,
} from "@/lib/services/notifications";

/* ============================
   🔒 TYPE GUARD
============================ */

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
    typeof p.bookingId === "string" &&
    !!p.schedule &&
    typeof p.schedule.startsAt === "string" &&
    typeof p.schedule.endsAt === "string" &&
    Array.isArray(p.services) &&
    Array.isArray(p.staff)
  );
}

/* ============================
   📥 INBOX CONTENT
============================ */

export default function InboxContent() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getMyNotifications({ kind: "ALL", limit: 50 })
      .then((res) => {
        if (!cancelled) {
          setNotifications(res.items);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? "Error cargando notificaciones");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <div className="p-6 text-destructive">{error}</div>;
  }

  if (!notifications.length) {
    return (
      <div className="p-6 text-muted-foreground">
        No tienes notificaciones
      </div>
    );
  }

  return (
    <div className="p-6 space-y-3">
      {notifications.map((n) => (
        <NotificationCard key={n.id} notification={n} />
      ))}
    </div>
  );
}

function NotificationCard({
  notification,
}: {
  notification: Notification;
}) {
  if (isBookingCreatedNotification(notification)) {
    return (
      <BookingCreatedCard
        notification={notification}
        payload={notification.payload}
      />
    );
  }

  return (
    <div className="rounded-md border p-4">
      <div className="text-sm font-medium">🔔 Notificación</div>
      <div className="text-xs text-muted-foreground">
        {new Date(notification.createdAt).toLocaleString()}
      </div>
    </div>
  );
}

export function BookingCreatedCard({
  notification,
  payload,
}: {
  notification: Notification;
  payload: BookingNotificationPayload;
}) {
  const starts = payload.schedule?.startsAt
    ? new Date(payload.schedule.startsAt)
    : null;

  const ends = payload.schedule?.endsAt
    ? new Date(payload.schedule.endsAt)
    : null;

  return (
    <div className="rounded-md border p-4 space-y-2">
      <div className="text-sm font-semibold">
        📅 Nueva cita creada
      </div>

      {/* Cliente */}
      {payload.client && (
        <div className="flex items-center gap-2">
          {payload.client.avatarUrl && (
            <img
              src={payload.client.avatarUrl}
              alt={payload.client.name ?? "Cliente"}
              className="h-6 w-6 rounded-full"
            />
          )}
          <span className="text-sm">
            {payload.client.name ?? "Cliente"}
          </span>
        </div>
      )}

      {/* Horario */}
      {starts && ends && (
        <div className="text-xs text-muted-foreground">
          {starts.toLocaleDateString()} ·{" "}
          {starts.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          –{" "}
          {ends.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}

      {/* Servicios */}
      <ul className="text-xs">
        {payload.services.map((s) => (
          <li key={s.id}>
            • {s.name} ({s.durationMin} min)
          </li>
        ))}
      </ul>

      {/* Staff */}
      {payload.staff.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Staff: {payload.staff.map((s) => s.name).join(", ")}
        </div>
      )}

      <div className="text-[11px] text-muted-foreground">
        {new Date(notification.createdAt).toLocaleString()}
      </div>
    </div>
  );
}