// /edit/tier/[tierId]/layout.tsx
"use client";

import { TierEditorProvider } from "@/context/TierEditorContext";

export default function TierLayout({ children }: { children: React.ReactNode }) {
  return <TierEditorProvider>{children}</TierEditorProvider>;
}