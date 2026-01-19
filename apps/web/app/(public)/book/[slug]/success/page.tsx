"use client"
import BookingSuccessDesktop from "./BookingSuccesDesktop";
import BookingSuccessMobile from "./BookingSuccesMobile";
import { useIsMobile } from "@/hooks/use-mobile";


export default function Page() {
  const isMobile = useIsMobile();

  return isMobile ? <BookingSuccessMobile /> : <BookingSuccessDesktop />;
}