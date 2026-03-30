"use client";

import { PublicAuthProvider } from "@/context/public/PublicAuthContext";

export default function GiftCardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicAuthProvider>{children}</PublicAuthProvider>;
}