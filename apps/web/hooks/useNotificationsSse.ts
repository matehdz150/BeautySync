"use client";

import { useEffect, useRef } from "react";
import { useBranch } from "@/context/BranchContext";

let globalEventSource: EventSource | null = null;
let currentBranch: string | null = null;

export function useNotificationsSse(onEvent: (event: any) => void) {
  const { branch } = useBranch(); // 👈 la sucursal activa
  const handlerRef = useRef(onEvent);
  // eslint-disable-next-line react-hooks/refs
  handlerRef.current = onEvent;

  useEffect(() => {
    const branchId = branch?.id ?? null;

    // 🔴 Sin branch → no conectar
    if (!branchId) return;

    // 🧠 Ya conectado a esta branch → no hacer nada
    if (globalEventSource && currentBranch === branchId) return;

    // 🔄 Cambió de branch → cerrar anterior
    if (globalEventSource) {
      console.log("🔄 Closing previous SSE (branch switch)");
      globalEventSource.close();
      globalEventSource = null;
    }

    console.log("🌐 Opening SSE connection for branch:", branchId);

    const es = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/notifications/stream?branchId=${branchId}`,
      { withCredentials: true }
    );

    currentBranch = branchId;
    globalEventSource = es;

    es.addEventListener("connected", (e: MessageEvent) => {
      console.log("🟢 SSE READY", JSON.parse(e.data));
    });

    es.addEventListener("notification.created", (e: MessageEvent) => {
      try {
        const event = JSON.parse(e.data);
        handlerRef.current(event);
      } catch (err) {
        console.error("SSE parse error", err, e.data);
      }
    });

    es.onerror = (err) => {
      console.error("🔴 SSE error", err);
    };

    return () => {
      // ❗ no cerrar aquí (layout persistence)
    };
  }, [branch?.id]);
}
