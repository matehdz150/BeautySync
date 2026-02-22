import { useEffect, useRef } from "react";
import { useChat } from "./useChat";
import { ChatMessage } from "@/context/chat/chat.types";
import { useAuth } from "@/context/AuthContext";
function mapActorToFrom(actor: {
  type: string;
}): "CLIENT" | "BRANCH" | "SYSTEM" {
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
  const { user } = useAuth(); // 👈 quien soy yo
  const chatRef = useRef(chat);

  useEffect(() => {
    chatRef.current = chat;
  }, [chat]);

  useEffect(() => {
    if (!conversationId) return;

    let cancelled = false;

    async function connect() {
      console.log("🟡 CONNECTING SSE (fetch)");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/manager/chat/${conversationId}/stream`,
        {
          method: "GET",
          credentials: "include",
          headers: { Accept: "text/event-stream" },
        },
      );

      if (!res.body) return;

      console.log("🟢 SSE CONNECTED (HTTP OK)");
      chatRef.current.setConnected(true);

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let buffer = "";

      while (!cancelled) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const chunk of parts) {
          if (!chunk.startsWith("event:")) continue;

          const eventMatch = chunk.match(/event:\s(.+)/);
          const dataMatch = chunk.match(/data:\s(.+)/);

          if (!eventMatch || !dataMatch) continue;

          const event = eventMatch[1];
          const data = JSON.parse(dataMatch[1]);

          console.log("📩 SSE EVENT:", event, data);

          if (event === "connected") {
            chatRef.current.setConnected(true);
            continue;
          }

          if (event === "chat.message") {
            const message = {
              id: data.messageId,
              body: data.preview,
              createdAt: data.createdAt,
              from: mapActorToFrom(data.actor),
            };

            // 👇 si es nuestro mensaje → confirmar optimistic
            if (message.from === "BRANCH") {
              chatRef.current.confirmLastPendingMessage(message);
              return; 
            }

            chatRef.current.pushIncomingMessage(message);
          }
        }
      }
    }

    connect();

    return () => {
      cancelled = true;
      chatRef.current.setConnected(false);
      console.log("⚫ SSE CLOSED");
    };
  }, [conversationId, user?.id]);
}
