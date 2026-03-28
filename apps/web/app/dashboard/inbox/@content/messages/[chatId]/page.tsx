"use client";

import { useParams } from "next/navigation";
import { Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

import { useChat } from "@/hooks/chat/useChat";
import { useChatStream } from "@/hooks/chat/useChatStream";
import { useSendMessage } from "@/hooks/chat/useSendMessage";
import { useChatMessages } from "@/hooks/chat/useChatMessages";

export default function ChatPage() {
  const params = useParams<{ chatId: string }>();
  const chatId = params?.chatId ?? null;

  const [text, setText] = useState("");

  // 🔥 proteger contra null
  const chat = useChat(chatId ?? "__none__");
  const send = useSendMessage(chatId);

  const appointment = chat.meta?.appointment;
  const client = appointment?.client;

  useChatStream(chatId);
  useChatMessages(chatId);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 🔥 Auto scroll siempre al último mensaje
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    el.scrollTop = el.scrollHeight;
  }, [chat.messages.length]);

  if (!chatId) return null;

  function handleSend() {
    if (!text.trim()) return;

    send(text);
    setText("");
  }

  console.log(chat);

  return (
    <div className="flex h-full flex-col">
      {/* HEADER */}
      <div className="border-b px-6 py-4 flex items-center gap-3">
        {/* avatar */}
        <div className="h-10 w-10 rounded-full overflow-hidden bg-black flex items-center justify-center text-sm font-medium text-white">
          {client?.avatarUrl ? (
            <img
              src={client.avatarUrl}
              className="w-full h-full object-cover"
            />
          ) : (
            (client?.name?.slice(0, 2) ?? "CL")
          )}
        </div>

        {/* info */}
        <div>
          <p className="font-semibold">{client?.name ?? "Cliente"}</p>

          {appointment?.service && (
            <p className="text-xs text-black/80">{appointment.service.name}</p>
          )}

          {appointment && (
            <p className="text-xs text-muted-foreground">
              {new Date(appointment.start).toLocaleDateString()} •{" "}
              {new Date(appointment.start).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" • "}
              {appointment.staff?.name}
            </p>
          )}

          <p className="text-[10px] text-muted-foreground mt-1">
            {chat.connected ? "Conectado" : "Reconectando..."}
          </p>
        </div>
      </div>

      {/* MESSAGES */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-4"
      >
        {chat.messages.map((msg) => {
          const fromMe = msg.from === "BRANCH";

          return (
            <div
              key={msg.id}
              className={cn("flex", fromMe ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-2 text-sm relative",
                  fromMe ? "bg-black text-white" : "bg-white border",
                  msg.pending && "opacity-60",
                  msg.error && "border-red-500",
                )}
              >
                <p>{msg.body}</p>

                <p className="mt-1 text-[10px] opacity-60 text-right">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* INPUT */}
      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 h-11 rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />

          <button
            onClick={handleSend}
            className="h-11 w-11 rounded-xl bg-black text-white flex items-center justify-center"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
