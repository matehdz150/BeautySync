"use client";

import Link from "next/link";
import { CheckCheck, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { api, API_URL } from "@/lib/services/api";
import { useBranch } from "@/context/BranchContext";

type ChatItem = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread?: number;
};

function formatTime(date: string) {
  const d = new Date(date);
  const now = new Date();

  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return "ahora";
  if (minutes < 60) return `${minutes} min`;
  if (hours < 24) return `${hours} h`;
  return d.toLocaleDateString();
}

export default function MessagesListPage() {
  const params = useParams<{ chatId?: string }>();
  const [q, setQ] = useState("");
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const esRef = useRef<EventSource | null>(null);

  const { branch } = useBranch();

  // 🔥 cargar inbox inicial
  useEffect(() => {
    if (!branch?.id) return;

    let cancelled = false;

    async function load() {
      try {
        const data = await api(
          `/manager/chat/inbox?branchId=${branch.id}`
        );

        if (cancelled) return;

        const mapped: ChatItem[] = data.map((c: any) => ({
          id: c.conversationId,
          name: c.client.name ?? "Cliente",
          lastMessage: c.lastMessage?.body ?? "Sin mensajes",
          time: c.lastMessage?.createdAt
            ? formatTime(c.lastMessage.createdAt)
            : "",
          unread: c.unread ? 1 : 0,
        }));

        setChats(mapped);
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [branch?.id]);

  // 🔥 SSE branch stream
  useEffect(() => {
    if (!branch?.id) return;

    const es = new EventSource(
      `${API_URL}/manager/chat/branch/${branch.id}/stream`,
      { withCredentials: true }
    );

    esRef.current = es;

    es.addEventListener("chat.message", (e: MessageEvent) => {
      const data = JSON.parse(e.data);

      setChats((prev) => {
        const index = prev.findIndex(
          (c) => c.id === data.conversationId
        );

        if (index === -1) return prev;

        const updated = [...prev];
        const existing = updated[index];

        // remover del lugar actual
        updated.splice(index, 1);

        // reinsertar arriba actualizado
        return [
          {
            ...existing,
            lastMessage: data.preview,
            time: formatTime(data.createdAt),
            unread:
              params?.chatId === data.conversationId
                ? 0
                : (existing.unread ?? 0) + 1,
          },
          ...updated,
        ];
      });
    });

    return () => {
      es.close();
    };
  }, [branch?.id, params?.chatId]);

  // 🔎 filtro
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return chats;

    return chats.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.lastMessage.toLowerCase().includes(query),
    );
  }, [q, chats]);

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur">
        <div className="p-4 pb-3">
          <h2 className="text-2xl font-semibold tracking-tight">Chats</h2>

          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar chats..."
              className="h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="h-px bg-border" />
      </div>

      {/* LIST */}
      <div className="p-4 space-y-1">
        {loading && (
          <div className="py-10 text-center text-muted-foreground text-sm">
            Cargando conversaciones...
          </div>
        )}

        {!loading &&
          filtered.map((chat) => {
            const active = params?.chatId === chat.id;

            return (
              <Link
                key={chat.id}
                href={`/dashboard/inbox/messages/${chat.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 transition",
                  active ? "bg-muted" : "hover:bg-muted/50",
                )}
              >
                <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center text-sm font-medium text-white">
                  {chat.name.slice(0, 2)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <p
                      className={cn(
                        "text-sm truncate",
                        active && "font-semibold",
                      )}
                    >
                      {chat.name}
                    </p>

                    <span className="text-xs text-muted-foreground">
                      {chat.time}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground truncate">
                      {chat.lastMessage}
                    </p>
                  </div>
                </div>

                {chat.unread > 0 && !active && (
                  <div className="h-6 min-w-6 px-2 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">
                    {chat.unread}
                  </div>
                )}
              </Link>
            );
          })}

        {!loading && filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No hay conversaciones
          </div>
        )}
      </div>
    </div>
  );
}