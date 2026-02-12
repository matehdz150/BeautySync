"use client";

import { useEffect, useMemo, useState } from "react";
import { getMyNotifications, Notification } from "@/lib/services/notifications";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { Search } from "lucide-react";
import { SegmentedControl } from "@/components/notifications/SegmentedControl";

export default function InboxContent() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  useEffect(() => {
    getMyNotifications({ kind: "ALL", limit: 50 })
      .then((res) => setNotifications(res.items))
      .catch(() => {});
  }, []);

  const filteredNotifications = useMemo(() => {
    let list = notifications;

    if (filter === "UNREAD") {
      list = list.filter((n) => !n.readAt);
    }

    if (query.trim()) {
      const lower = query.toLowerCase();

      list = list.filter((n) => {
        const text =
          JSON.stringify(n.payload).toLowerCase() +
          n.kind.toLowerCase();
        return text.includes(lower);
      });
    }

    return list;
  }, [notifications, query, filter]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 🔝 Header (NO scroll) */}
      <div className="shrink-0">
        <InboxHeader filter={filter} setFilter={setFilter} />
        <SearchBar query={query} setQuery={setQuery} />
      </div>

      {/* 📜 Scrollable Notifications */}
      <div className="flex-1 overflow-y-auto pb-6">
        {!filteredNotifications.length ? (
          <div className="p-10 text-center text-muted-foreground">
            No hay resultados
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <NotificationCard key={n.id} notification={n} />
          ))
        )}
      </div>
    </div>
  );
}

function InboxHeader({
  filter,
  setFilter,
}: {
  filter: "ALL" | "UNREAD";
  setFilter: (v: "ALL" | "UNREAD") => void;
}) {
  return (
    <div className="px-4 mb-6 mt-4 flex items-center justify-between">
      {/* Title */}
      <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>

      {/* Segmented Control */}
      <SegmentedControl value={filter} onChange={setFilter} />
    </div>
  );
}

function SearchBar({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (v: string) => void;
}) {
  return (
    <div className="px-4 mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar"
          className="
            w-full
            h-13
            rounded-2xl
            border
            pl-9 pr-4
            text-sm
            outline-none
            transition-all
            focus:ring-2
            focus:ring-blue-500/30
          "
        />
      </div>
    </div>
  );
}
