"use client";

import { useEffect, useRef } from "react";
import { useChat } from "./useChat";

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

export function useChatStream(conversationId: string | null) {
  const chat = useChat(conversationId ?? "__none__");
  const chatRef = useRef(chat);

  useEffect(() => {
    chatRef.current = chat;
  }, [chat]);

  useEffect(() => {
    if (!conversationId) return;

    console.log("🟡 CONNECTING SSE (EventSource)", conversationId);

    const es = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/manager/chat/${conversationId}/stream`,
      { withCredentials: true }
    );

    es.onopen = () => {
      console.log("🟢 SSE CONNECTED");
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

      if (message.from === "BRANCH") {
        chatRef.current.confirmLastPendingMessage(message);
        return;
      }

      chatRef.current.pushIncomingMessage(message);
    });

    es.onerror = () => {
      console.log("🔴 SSE ERROR");
      chatRef.current.setConnected(false);
    };

    return () => {
      console.log("⚫ SSE CLOSED", conversationId);
      es.close();
      chatRef.current.setConnected(false);
    };
  }, [conversationId]);
}