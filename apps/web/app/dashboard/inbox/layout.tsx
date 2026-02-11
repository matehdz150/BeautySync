"use client";

import { useState, useRef, useEffect } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

import InboxSidebar from "@/components/inbox/InboxSidebar";
import { redirect } from "next/navigation";

export default function InboxLayout({
  list,
  content,
}: {
  list: React.ReactNode;
  content: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarInnerRef = useRef<HTMLDivElement>(null);

  if (!list && !content) {
    redirect("/dashboard/inbox/main");
  }

  /* Detecta ancho real del panel */
  useEffect(() => {
    if (!sidebarInnerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      setSidebarCollapsed(width <= 120);
    });

    observer.observe(sidebarInnerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="h-full w-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">

        {/* SIDEBAR */}
        <ResizablePanel
          defaultSize={150}
          minSize={60}
          maxSize={200}
        >
          <div ref={sidebarInnerRef} className="h-full">
            <InboxSidebar collapsed={sidebarCollapsed} />
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* LIST PANEL (CONTROLADO POR /@list) */}
        <ResizablePanel defaultSize={50} minSize={400} maxSize={550}>
          <div className="h-full border-r">
            {list}
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* CONTENT PANEL (CONTROLADO POR /@content) */}
        <ResizablePanel defaultSize={50}>
          <div className="h-full">
            {content}
          </div>
        </ResizablePanel>

      </ResizablePanelGroup>
    </div>
  );
}