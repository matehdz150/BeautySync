"use client";

import { useNotifications } from "@/context/NotificationsContext";
import { useNotificationsSse } from "@/hooks/useNotificationsSse";
import { getNotificationItem } from "@/lib/services/notifications";

export function NotificationsRealtimeBridge() {
  const { addNotification } = useNotifications();

  useNotificationsSse(async ({ id }) => {
    if (!id) return;

    try {
      console.log("🔥 SSE INVALIDATION:", id);

      const notification = await getNotificationItem(id);

      console.log("📥 FETCHED NOTIFICATION:", notification.id);

      addNotification(notification);
    } catch (err) {
      console.error("❌ Failed to fetch notification", id, err);
    }
  });

  return null;
}