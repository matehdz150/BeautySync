"use client";

import { AvailabilityProvider } from "@/context/AvailabilityContext";

export default function PublicDateTimeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AvailabilityProvider>
      {children}
    </AvailabilityProvider>
  );
}