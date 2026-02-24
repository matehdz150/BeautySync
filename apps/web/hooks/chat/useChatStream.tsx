"use client";

import { useEffect, useRef } from "react";
import { useChat } from "./useChat";

type ChatScope = "manager" | "public";

function mapActorToFrom(actor: { type: string }): "CLIENT" | "BRANCH" | "SYSTEM" {
  switch (actor.type) {
    case "CLIENT":
      return "CLIENT";
    case "USER":
      return "BRANCH";
    default:
      return "SYSTEM";
  }
}

export function useChatStream(
  conversationId: string | null,
  scope: ChatScope = "manager"
) {
  const chat = useChat(conversationId ?? "__none__");
  const chatRef = useRef(chat);

  useEffect(() => {
    chatRef.current = chat;
  }, [chat]);

  useEffect(() => {
    if (!conversationId) return;

    const base =
      scope === "manager" ? "/manager/chat" : "/public/chat";

    const es = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}${base}/${conversationId}/stream`,
      { withCredentials: true }
    );

    es.onopen = () => {
      chatRef.current.setConnected(true);
    };

    es.addEventListener("chat.message", (e: MessageEvent) => {
      const data = JSON.parse(e.data);

      const message = {
        id: data.messageId,
        body: data.preview,
        createdAt: data.createdAt,
        from: mapActorToFrom(data.actor),
      };

      chatRef.current.pushIncomingMessage(message);
    });

    es.onerror = () => {
      chatRef.current.setConnected(false);
    };

    return () => {
      es.close();
      chatRef.current.setConnected(false);
    };
  }, [conversationId, scope]);
}