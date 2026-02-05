"use client";

import { createContext, useContext } from "react";

type DesktopViewState = {
  showList: boolean;
  showDetail: boolean;
  showRate: boolean;
};

const BookingsDesktopContext = createContext<DesktopViewState | null>(null);

export function useBookingsDesktop() {
  const ctx = useContext(BookingsDesktopContext);
  if (!ctx) {
    throw new Error("useBookingsDesktop must be used inside provider");
  }
  return ctx;
}

export function BookingsDesktopProvider({
  value,
  children,
}: {
  value: DesktopViewState;
  children: React.ReactNode;
}) {
  return (
    <BookingsDesktopContext.Provider value={value}>
      {children}
    </BookingsDesktopContext.Provider>
  );
}