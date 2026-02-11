"use client";

import { useParams } from "next/navigation";
import { Send } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const MOCK_MESSAGES = [
  {
    id: 1,
    text: "Hola! ¿Te queda bien mañana?",
    fromMe: false,
    time: "10:32",
  },
  {
    id: 2,
    text: "Sí claro 🙌",
    fromMe: true,
    time: "10:33",
  },
  {
    id: 3,
    text: "Perfecto, te agendo.",
    fromMe: false,
    time: "10:34",
  },
];

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const [message, setMessage] = useState("");

  if (!chatId) return null;

  return (
    <div className="flex h-full flex-col">
      {/* HEADER */}
      <div className="border-b px-6 py-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium">
          CL
        </div>

        <div>
          <p className="font-semibold">Cliente {chatId}</p>
          <p className="text-xs text-muted-foreground">En línea</p>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {MOCK_MESSAGES.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.fromMe ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[70%] rounded-2xl px-4 py-2 text-sm",
                msg.fromMe
                  ? "bg-black text-white"
                  : "bg-white border"
              )}
            >
              <p>{msg.text}</p>
              <p className="mt-1 text-[10px] opacity-60 text-right">
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 h-11 rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <button
            className="h-11 w-11 rounded-xl bg-black text-white flex items-center justify-center"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}