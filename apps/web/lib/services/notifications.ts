// src/lib/services/notifications.ts
import { api } from "./api";

// ============================
// ✅ TYPES (sin unresolved)
// ============================

export type NotificationKind =
  | "BOOKING_CREATED"
  | "BOOKING_CANCELLED"
  | "BOOKING_RESCHEDULED"
  | "CHAT_MESSAGE";

export type NotificationTarget = "MANAGER" | "CLIENT";

export type NotificationsFilterKind = "ALL" | "BOOKING" | "CHAT";

export interface GetNotificationsParams {
  unread?: boolean;
  kind?: NotificationsFilterKind;
  cursor?: string;
  limit?: number;
}

// Payload para notificaciones de booking (lo que ya estás armando)
export interface BookingNotificationPayload {
  bookingId: string;

  schedule: {
    startsAt: string; // ISO
    endsAt: string; // ISO
  };

  services: Array<{
    id: string;
    name: string;
    durationMin: number;
    priceCents: number;
  }>;

  client: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  } | null;

  staff: Array<{
    id: string;
    name: string | null;
    avatarUrl: string | null;
  }>;

  meta?: {
    totalCents?: number;
  };
}

// Payload para chat (si luego lo agregas)
export interface ChatNotificationPayload {
  chatId: string;
  messageId: string;
  senderUserId?: string | null;
  recipientUserId?: string | null;
  recipientClientId?: string | null;
}

// Discriminated union para payload (sin any)
export type NotificationPayload =
  | BookingNotificationPayload
  | ChatNotificationPayload
  | Record<string, unknown>; // fallback seguro (por si agregas kinds nuevos)

export interface Notification {
  id: string;
  target: NotificationTarget;
  kind: NotificationKind;

  bookingId: string | null;
  branchId: string | null;

  recipientUserId: string | null;
  recipientClientId: string | null;

  payload: NotificationPayload;

  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  items: Notification[];
  nextCursor: string | null;
}

// ============================
// ✅ API CALL
// ============================

/**
 * 🔔 Obtener notificaciones del usuario autenticado
 * /notifications?unread=true&kind=BOOKING&cursor=...&limit=20
 */
export async function getMyNotifications(
  params: GetNotificationsParams = {},
): Promise<NotificationsResponse> {
  const search = new URLSearchParams();

  if (params.unread !== undefined) {
    search.set("unread", String(params.unread));
  }

  if (params.kind && params.kind !== "ALL") {
    search.set("kind", params.kind);
  }

  if (params.cursor) {
    search.set("cursor", params.cursor);
  }

  if (params.limit !== undefined) {
    search.set("limit", String(params.limit));
  }

  const query = search.toString();
  const path = query ? `/notifications?${query}` : `/notifications`;

  return api<NotificationsResponse>(path);
}

// ============================
// ✅ DETAIL RESPONSE
// ============================

export interface NotificationDetailResponse {
  notification: Notification;

  booking?: {
    id: string;
    branchId: string;
    startsAt: string;
    endsAt: string;
    status: string;
    paymentMethod: string;
    totalCents: number;
    notes: string | null;
    createdAt: string;
    updatedAt: string;

    appointments: Array<{
      id: string;
      start: string;
      end: string;
      status: string;
      paymentStatus: string;
      priceCents: number | null;
      notes: string | null;

      service: {
        id: string;
        name: string;
        durationMin: number;
        priceCents: number | null;
      };

      staff: {
        id: string;
        name: string | null;
        avatarUrl: string | null;
      } | null;

      client: {
        id: string;
        name: string | null;
        avatarUrl: string | null;
      } | null;
    }>;
  };

  branch?: {
    id: string;
    name: string;
    address: string | null;
    description: string | null;
    lat: string | null;
    lng: string | null;

    images: Array<{
      id: string;
      url: string;
      isCover: boolean;
      position: number;
    }>;
  };
}

/**
 * 🔎 Obtener detalle completo de una notificación
 * GET /notifications/:id
 */
export async function getNotificationDetail(
  notificationId: string,
): Promise<NotificationDetailResponse> {
  return api<NotificationDetailResponse>(
    `/notifications/${notificationId}`,
  );
}