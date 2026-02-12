"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { getMyNotifications, Notification } from "@/lib/services/notifications";

interface ContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Notification) => void;
}

const NotificationsContext = createContext<ContextType | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // SNAPSHOT
  useEffect(() => {
    getMyNotifications({ kind: "ALL", limit: 50 }).then((res) => {
      setNotifications((prev) => {
        const ids = new Set(prev.map(n => n.id));
        const merged = [...prev];

        for (const n of res.items) {
          if (!ids.has(n.id)) merged.push(n);
        }

        return merged;
      });
    });
  }, []);

  // REALTIME INSERT
  const addNotification = useCallback((n: Notification) => {
    if (!n?.id) return;

    setNotifications((prev) => {
      if (prev.some(x => x.id === n.id)) return prev;
      return [n, ...prev]; // <- nueva referencia SIEMPRE
    });
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.readAt).length,
    [notifications]
  );

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, addNotification }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside provider");
  return ctx;
}