"use client";

import { useEffect, useRef } from "react";
import { useBranch } from "@/context/BranchContext";

let globalEventSource: EventSource | null = null;
let currentBranch: string | null = null;

export function useNotificationsSse(onEvent: (event: any) => void) {
  const { branch } = useBranch();

  const handlerRef = useRef(onEvent);
  // eslint-disable-next-line react-hooks/refs
  handlerRef.current = onEvent;

  useEffect(() => {
    const branchId = branch?.id ?? null;
    if (!branchId) return;

    function connect() {
      console.log("🌐 Opening SSE for branch:", branchId);

      const es = new EventSource(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/stream?branchId=${branchId}`,
        { withCredentials: true }
      );

      globalEventSource = es;
      currentBranch = branchId;

      es.addEventListener("connected", (e: MessageEvent) => {
        console.log("🟢 SSE READY", JSON.parse(e.data));
      });

      es.addEventListener("notification.created", (e: MessageEvent) => {
        try {
          const event = JSON.parse(e.data);
          handlerRef.current(event);
        } catch (err) {
          console.error("SSE parse error", err);
        }
      });

      es.onerror = () => {
        console.warn("🔴 SSE disconnected, retrying...");

        es.close();
        globalEventSource = null;

        setTimeout(connect, 3000); // reconnect
      };
    }

    if (!globalEventSource || currentBranch !== branchId) {
      if (globalEventSource) {
        globalEventSource.close();
      }

      connect();
    }

    return () => {};
  }, [branch?.id]);
}