"use client";

import { api } from "@/lib/services/api";
import { useChat } from "./useChat";
import { ChatMessage } from "@/context/chat/chat.types";

export function useSendMessage(conversationId: string | null, bookingId?: string) {
  const chat = useChat(conversationId ?? "__none__");

  async function send(body: string) {
    const finalBookingId = bookingId ?? chat.meta?.bookingId;

    if (!finalBookingId) {
      console.error("BookingId missing");
      return;
    }

    // solo optimistic si ya existe conversación
    if (conversationId) {
      const tempId = `temp-${Date.now()}`;

      const optimistic: ChatMessage = {
        id: tempId,
        body,
        from: "BRANCH",
        createdAt: new Date().toISOString(),
        pending: true,
      };

      chat.addOptimisticMessage(optimistic);
    }

    try {
      await api("/manager/chat/messages", {
        method: "POST",
        body: JSON.stringify({
          bookingId: finalBookingId,
          body,
        }),
      });
    } catch (err) {
      console.error(err);
    }
  }

  return send;
}