"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import PublicStaffDesktopPage from "./PublicStaffDesktop";
import { PublicStaffMobilePage } from "./PublicStaffMobile";

export default function PublicStaffPage() {
  const isMobile = useIsMobile();

  return isMobile ? <PublicStaffMobilePage /> : <PublicStaffDesktopPage />;
}