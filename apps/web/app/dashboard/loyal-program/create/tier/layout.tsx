"use client";

import { TierDraftProvider } from "./TierDraftContext";

export default function TierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TierDraftProvider>{children}</TierDraftProvider>;
}
