"use client";

import { Suspense } from "react";
import InboxContent from "./InboxContent";

export default function InboxMainList() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-muted-foreground">
          Cargando…
        </div>
      }
    >
      <InboxContent />
    </Suspense>
  );
}