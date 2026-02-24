"use client";

import { api } from "@/lib/services/api";
import { useChat } from "./useChat";
import { ChatMessage } from "@/context/chat/chat.types";

type ChatScope = "manager" | "public";

type SendMessageResponse = {
  conversationId: string;
  messageId: string;
  created: boolean;
};

export function useSendMessage(
  conversationId: string | null,
  bookingId?: string,
  scope: ChatScope = "manager"
) {
  const chat = useChat(conversationId ?? "__none__");

  async function send(body: string): Promise<SendMessageResponse | null> {
    const finalBookingId = bookingId ?? chat.meta?.bookingId;
    if (!finalBookingId) return null;

    const base =
      scope === "manager" ? "/manager/chat" : "/public/chat";

    let tempId: string | null = null;

    if (conversationId) {
      tempId = `temp-${Date.now()}`;

      const optimistic: ChatMessage = {
        id: tempId,
        body,
        from: scope === "manager" ? "BRANCH" : "CLIENT",
        createdAt: new Date().toISOString(),
        pending: true,
      };

      chat.addOptimisticMessage(optimistic);
    }

    try {
      const res = await api<SendMessageResponse>(`${base}/messages`, {
        method: "POST",
        body: JSON.stringify({
          bookingId: finalBookingId,
          body,
        }),
      });

      return res;
    } catch (err) {
      if (tempId) {
        chat.markError(tempId);
      }
      throw err;
    }
  }

  return send;
}