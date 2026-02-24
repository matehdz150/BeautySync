"use client";

import { useEffect } from "react";
import { api } from "@/lib/services/api";
import { useChat } from "./useChat";
import { ChatMessage } from "@/context/chat/chat.types";

type ServerMessage = {
  id: string;
  body: string;
  createdAt: string;
  from: "CLIENT" | "BRANCH" | "SYSTEM";
};

type ChatScope = "manager" | "public";

export function useChatMessages(
  conversationId: string | null,
  scope: ChatScope = "manager" // 👈 default mantiene manager intacto
) {
  const chat = useChat(conversationId ?? "__none__");

  useEffect(() => {
    if (!conversationId) return;

    let cancelled = false;

    async function load() {
      try {
        const base =
          scope === "manager" ? "/manager/chat" : "/public/chat";

        const data = await api(
          `${base}/${conversationId}/messages?limit=50`
        );

        if (cancelled) return;

        chat.setMeta({
          bookingId: data.bookingId,
          branchId: data.branchId,
        });

        const msgs: ChatMessage[] = data.items.map(
          (m: ServerMessage) => ({
            id: m.id,
            body: m.body,
            createdAt: m.createdAt,
            from: m.from,
          })
        );

        msgs.forEach((m) => chat.pushIncomingMessage(m));
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [conversationId, scope]);
}