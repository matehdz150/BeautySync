"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { MessageSquare, ArrowRight, Send } from "lucide-react";

import { useConversationByBooking } from "@/hooks/chat/useConversationsByBooking";
import { useSendMessage } from "@/hooks/chat/useSendMessage";

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

type Props = {
  bookingId: string;
  className?: string;
};

export function BookingChatPreview({ bookingId, className }: Props) {
  const router = useRouter();

  const { conversation, loading, exists } =
    useConversationByBooking(bookingId);


  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const send = useSendMessage(null, bookingId);

  const last = conversation?.lastMessage ?? null;

  const subtitle = useMemo(() => {
    if (!exists) return "Aún no hay conversación para este booking.";
    if (!last) return "Conversación creada, sin mensajes aún.";
    return last.body || "Sin mensajes";
  }, [exists, last]);

  const time = last?.createdAt ? formatTime(last.createdAt) : "";

  // 🔥 Redirección automática cuando backend crea la conversación
  useEffect(() => {
    if (!sending) return;

    if (exists && conversation?.conversationId) {
      router.push(
        `/dashboard/inbox/messages/${conversation.conversationId}`
      );
    }
  }, [sending, exists, conversation?.conversationId, router]);

  return (
    <Card className={cn("rounded-2xl", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
              <MessageSquare className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">Chat</p>
              <p className="text-xs text-muted-foreground leading-tight">
                {exists ? "Conversación del booking" : "Sin conversación"}
              </p>
            </div>
          </div>

          {exists && conversation?.unread ? (
            <Badge className="rounded-full" variant="default">
              Nuevo
            </Badge>
          ) : (
            <Badge className="rounded-full" variant="secondary">
              {exists ? "Al día" : "—"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
        ) : (
          <>
            {/* ========================= */}
            {/* YA EXISTE CONVERSACIÓN */}
            {/* ========================= */}
            {exists && conversation?.conversationId && (
              <>
                <div className="rounded-xl border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {subtitle}
                    </p>

                    <div className="shrink-0 text-xs text-muted-foreground">
                      {time}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Button asChild className="rounded-xl">
                    <Link
                      href={`/dashboard/inbox/messages/${conversation.conversationId}`}
                    >
                      Abrir chat
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>

                  <Button variant="outline" className="rounded-xl" asChild>
                    <Link href={`/dashboard/inbox`}>Ver inbox</Link>
                  </Button>
                </div>
              </>
            )}

            {/* ========================= */}
            {/* NO EXISTE CONVERSACIÓN */}
            {/* ========================= */}
            {!exists && (
              <>
                <div className="mt-2 rounded-xl border bg-background p-3">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Escribe el primer mensaje al cliente..."
                    className="w-full resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    rows={3}
                    disabled={sending}
                  />

                  <div className="flex justify-end mt-3">
                    <Button
                      disabled={!text.trim() || sending}
                      onClick={async () => {
                        setSending(true);
                        await send(text);
                      }}
                      className="rounded-xl"
                    >
                      {sending ? "Enviando..." : "Enviar mensaje"}
                      <Send className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  La conversación se creará automáticamente al enviar el primer mensaje.
                </p>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}