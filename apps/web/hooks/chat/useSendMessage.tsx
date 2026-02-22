import { api } from "@/lib/services/api";
import { useChat } from "./useChat";
import { ChatMessage } from "@/context/chat/chat.types";

export function useSendMessage(conversationId: string, bookingId: string) {
  const chat = useChat(conversationId);

  async function send(body: string) {
    const tempId = `temp-${Date.now()}`;

    const optimistic: ChatMessage = {
      id: tempId,
      body,
      from: "BRANCH",
      createdAt: new Date().toISOString(),
      pending: true,
    };

    // instant UI
    chat.addOptimisticMessage(optimistic);

    try {
      await api("/manager/chat/messages", {
        method: "POST",
        body: JSON.stringify({ bookingId, body }),
      });

      // esperamos SSE → NO confirmamos aquí
    } catch {
      chat.markError(tempId);
    }
  }

  return send;
}