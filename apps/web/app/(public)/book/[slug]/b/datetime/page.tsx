"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { PublicDateTimeDesktop } from "./PublicDateTimeDesktop";
import PublicDateTimeMobilePage from "./PublicDateTimeMobile";

export default function PublicDateTimePage() {
  const isMobile = useIsMobile();

  if (isMobile) return <PublicDateTimeMobilePage />;

  return <PublicDateTimeDesktop />;
}