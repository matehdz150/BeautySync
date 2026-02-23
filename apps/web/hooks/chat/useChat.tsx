"use client";

import { useContext, useMemo } from "react";
import { ChatContext } from "../../context/chat/ChatContext";
import { ChatMessage } from "@/context/chat/chat.types";

export function useChat(conversationId: string) {
  const ctx = useContext(ChatContext);

  if (!ctx) {
    throw new Error("useChat must be used inside <ChatProvider>");
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const conv = ctx.state[conversationId] ?? {
    messages: [],
    connected: false,
    meta: {},
  };

  return useMemo(
    () => ({
      messages: conv.messages,
      connected: conv.connected,
      meta: conv.meta,

      addOptimisticMessage: (msg: ChatMessage) =>
        ctx.addOptimisticMessage(conversationId, msg),

      confirmMessage: (tempId: string, real: ChatMessage) =>
        ctx.confirmMessage(conversationId, tempId, real),

      confirmLastPendingMessage: (real: ChatMessage) =>
        ctx.confirmLastPendingMessage(conversationId, real),

      pushIncomingMessage: (msg: ChatMessage) =>
        ctx.pushIncomingMessage(conversationId, msg),

      markError: (tempId: string) =>
        ctx.markError(conversationId, tempId),

      setConnected: (value: boolean) =>
        ctx.setConnected(conversationId, value),

      setMeta: (meta: { bookingId?: string; branchId?: string }) =>
        ctx.setMeta(conversationId, meta),
    }),
    [conv, ctx, conversationId]
  );
}