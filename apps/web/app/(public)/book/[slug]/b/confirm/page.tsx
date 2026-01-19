"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { ConfirmBookingMobilePage } from "./ConfirmBookingMobile";
import { ConfirmBookingDesktopPage } from "./ConfirmBookingDesktop";

export default function ConfirmBookingPage() {
  const isMobile = useIsMobile();

  if (isMobile) return <ConfirmBookingMobilePage />;
  return <ConfirmBookingDesktopPage />;
}