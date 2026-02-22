"use client";

import { useEffect, useRef } from "react";
import { api } from "@/lib/services/api";
import { useChat } from "./useChat";
import { ChatMessage } from "@/context/chat/chat.types";

type ServerMessage = {
  id: string;
  body: string;
  createdAt: string;
  from: "CLIENT" | "BRANCH" | "SYSTEM";
};

export function useChatMessages(conversationId: string | null) {
  const chat = useChat(conversationId ?? "__none__");
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!conversationId) return;
    if (loadedRef.current) return;

    loadedRef.current = true;

    (async () => {
      const data = await api(`/manager/chat/${conversationId}/messages?limit=50`);

      const msgs: ChatMessage[] = data.items.map((m: ServerMessage) => ({
        id: m.id,
        body: m.body,
        createdAt: m.createdAt,
        from: m.from,
      }));

      // insertarlos sin duplicar
      msgs.forEach(chat.pushIncomingMessage);
    })();
  }, [conversationId]);
}