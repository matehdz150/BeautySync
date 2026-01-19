import type { ReactNode } from "react";
import { PublicHeader } from "@/components/book/PublicHeader";
import { PublicBookingProvider } from "@/context/PublicBookingContext";

export default function PublicBranchLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { slug: string };
}) {
  return (
    <PublicBookingProvider>
      <div className="h-dvh flex flex-col bg-white w-full">
        <PublicHeader />

        <main className="flex-1 overflow-y-auto w-full px-0 lg:px-10">
          {children}
        </main>
      </div>
    </PublicBookingProvider>
  );
}