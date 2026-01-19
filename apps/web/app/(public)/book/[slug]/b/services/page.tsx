"use client"
import { useIsMobile } from "@/hooks/use-mobile";
import PublicServicesPage from "./PublicServicesPage";
import PublicServicesMobilePage from "./PublicServicesPageMobile";

export default function Page() {
  const isMobile = useIsMobile();

  return isMobile ? <PublicServicesMobilePage /> : <PublicServicesPage />;
}