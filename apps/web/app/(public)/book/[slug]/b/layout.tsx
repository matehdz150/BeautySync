"use client";

import { useIsMobile } from "@/hooks/use-mobile";

import { BookingLayoutBase } from "./BookingLayoutBase";
import { BookingLayoutDesktopShell } from "./BookingLayoutDesktop";
import { BookingLayoutMobileShell } from "./BookingLayoutMobile";

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();

  return (
    <BookingLayoutBase
      render={(props) =>
        isMobile ? (
          <BookingLayoutMobileShell {...props} />
        ) : (
          <BookingLayoutDesktopShell {...props} />
        )
      }
    >
      {children}
    </BookingLayoutBase>
  );
}