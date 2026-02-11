"use client";

import Link from "next/link";
import { CheckCheck, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";

type ChatItem = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread?: number;
  online?: boolean;
};

const chats: ChatItem[] = [
  {
    id: "123",
    name: "Jacquenetta Slowgrave",
    lastMessage: "Great! Looking forward to it.",
    time: "10 min",
    unread: 8,
    online: true,
  },
  {
    id: "456",
    name: "Nickola Peever",
    lastMessage: "Sounds perfect! I've been wanting...",
    time: "40 min",
    unread: 2,
    online: true,
  },
  {
    id: "789",
    name: "Farand Hume",
    lastMessage: "How about 7 PM at the new Italian...",
    time: "Yesterday",
  },
];

export default function MessagesListPage() {
  const params = useParams<{ chatId?: string }>();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return chats;

    return chats.filter((c) => {
      return (
        c.name.toLowerCase().includes(query) ||
        c.lastMessage.toLowerCase().includes(query)
      );
    });
  }, [q]);

  return (
    <div className="h-full overflow-y-auto">
      {/* Header + Search */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4 pb-3">
          <h2 className="text-2xl font-semibold tracking-tight">Chats</h2>

          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar chats..."
                className={cn(
                  "h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary"
                )}
              />
            </div>
          </div>
        </div>
        <div className="h-px bg-border" />
      </div>

      {/* List */}
      <div className="p-4 space-y-1">
        {filtered.map((chat) => {
          const active = params?.chatId === chat.id;

          return (
            <Link
              key={chat.id}
              href={`/dashboard/inbox/messages/${chat.id}`}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 transition",
                active ? "bg-muted" : "hover:bg-muted/50"
              )}
            >
              {/* Avatar */}
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center text-sm font-medium text-white">
                  {chat.name.slice(0, 2)}
                </div>

                {chat.online && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p
                    className={cn(
                      "text-sm truncate",
                      active ? "font-semibold" : "font-medium"
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

              {/* Unread */}
              {chat.unread && !active && (
                <div className="ml-2">
                  <div className="h-6 min-w-6 px-2 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">
                    {chat.unread}
                  </div>
                </div>
              )}
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No hay resultados para “{q.trim()}”.
          </div>
        )}
      </div>
    </div>
  );
}