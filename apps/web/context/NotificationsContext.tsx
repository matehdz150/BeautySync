"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import {
  getMyNotifications,
  Notification,
} from "@/lib/services/notifications";

interface ContextType {
  notifications: Notification[];
  unreadCount: number;

  addNotification: (n: Notification) => void;
  markAsReadLocal: (id: string) => void; // 👈 NUEVO
}

const NotificationsContext = createContext<ContextType | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // SNAPSHOT
  useEffect(() => {
    getMyNotifications({ kind: "ALL", limit: 50 }).then((res) => {
      setNotifications(res.items);
    });
  }, []);

  // INSERT REALTIME
  const addNotification = useCallback((n: Notification) => {
    if (!n?.id) return;

    setNotifications((prev) => {
      if (prev.some(x => x.id === n.id)) return prev;
      return [n, ...prev];
    });
  }, []);

  // 👇 MARCAR COMO LEIDA LOCAL
  const markAsReadLocal = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id && !n.readAt
          ? { ...n, readAt: new Date().toISOString() }
          : n
      )
    );
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.readAt).length,
    [notifications]
  );

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, addNotification, markAsReadLocal }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside provider");
  return ctx;
}