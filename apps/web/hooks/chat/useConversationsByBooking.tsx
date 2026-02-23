"use client";

import { useEffect, useState } from "react";
import {
  getConversationByBooking,
  ConversationPreview,
} from "@/lib/services/messages";

export function useConversationByBooking(bookingId?: string) {
  const [data, setData] = useState<ConversationPreview | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await getConversationByBooking(bookingId ?? '');
        if (!cancelled) setData(res);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  return {
    conversation: data,
    loading,
    exists: Boolean(data?.conversationId),
  };
}