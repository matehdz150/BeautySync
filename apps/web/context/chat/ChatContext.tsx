"use client";

import React, { createContext, useState } from "react";
import { ChatMessage, ChatState } from "./chat.types";

type ChatContextValue = {
  state: ChatState;

  addOptimisticMessage: (conversationId: string, msg: ChatMessage) => void;
  confirmMessage: (
    conversationId: string,
    tempId: string,
    real: ChatMessage,
  ) => void;
  pushIncomingMessage: (conversationId: string, msg: ChatMessage) => void;
  markError: (conversationId: string, tempId: string) => void;
  setConnected: (conversationId: string, value: boolean) => void;
  confirmLastPendingMessage: (
    conversationId: string,
    real: ChatMessage,
  ) => void;
};

export const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ChatState>({});

  function getConv(prev: ChatState, id: string) {
    return prev[id] ?? { messages: [], connected: false };
  }

  function addOptimisticMessage(conversationId: string, msg: ChatMessage) {
    setState((prev) => {
      const conv = getConv(prev, conversationId);

      return {
        ...prev,
        [conversationId]: {
          ...conv,
          messages: [...conv.messages, msg],
        },
      };
    });
  }

  function confirmMessage(
    conversationId: string,
    tempId: string,
    real: ChatMessage,
  ) {
    setState((prev) => {
      const conv = getConv(prev, conversationId);

      return {
        ...prev,
        [conversationId]: {
          ...conv,
          messages: conv.messages.map((m) => (m.id === tempId ? real : m)),
        },
      };
    });
  }

  function pushIncomingMessage(conversationId: string, msg: ChatMessage) {
    setState((prev) => {
      const conv = getConv(prev, conversationId);

      // evitar duplicados por SSE reconnection
      if (conv.messages.some((m) => m.id === msg.id)) return prev;

      return {
        ...prev,
        [conversationId]: {
          ...conv,
          messages: [...conv.messages, msg],
        },
      };
    });
  }

  function markError(conversationId: string, tempId: string) {
    setState((prev) => {
      const conv = getConv(prev, conversationId);

      return {
        ...prev,
        [conversationId]: {
          ...conv,
          messages: conv.messages.map((m) =>
            m.id === tempId ? { ...m, error: true, pending: false } : m,
          ),
        },
      };
    });
  }

  function setConnected(conversationId: string, value: boolean) {
    setState((prev) => {
      const conv = getConv(prev, conversationId);

      return {
        ...prev,
        [conversationId]: {
          ...conv,
          connected: value,
        },
      };
    });
  }

  function confirmLastPendingMessage(
    conversationId: string,
    real: ChatMessage,
  ) {
    setState((prev) => {
      const conv = prev[conversationId];
      if (!conv) return prev;

      let replaced = false;

      const newMessages = conv.messages.map((m) => {
        if (!replaced && m.pending && m.from === real.from) {
          replaced = true;
          return { ...real, pending: false };
        }
        return m;
      });

      // 👇 SI NO HUBO PENDING, INSERTARLO
      if (!replaced) {
        newMessages.push(real);
      }

      return {
        ...prev,
        [conversationId]: {
          ...conv,
          messages: [...newMessages], // 🔥 FORZAR NUEVA REFERENCIA
        },
      };
    });
  }

  return (
    <ChatContext.Provider
      value={{
        state,
        addOptimisticMessage,
        confirmMessage,
        pushIncomingMessage,
        markError,
        setConnected,
        confirmLastPendingMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
