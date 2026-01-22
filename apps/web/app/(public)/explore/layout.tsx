import type { ReactNode } from "react";
import { PublicHeader } from "@/components/book/PublicHeader";

export default function PublicBranchLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative h-dvh flex flex-col overflow-hidden bg-gray-50">
      {/* Gradient (empieza desde arriba, atrás del header) */}
      <div className="pointer-events-none absolute left-1/2 -top-70 h-125 w-255 -translate-x-1/2 z-10 bg-gradient-to-b from-indigo-400/55 via-indigo-300/40 to-transparent rounded-full blur-3xl" />
      

      <PublicHeader />

      <main className="flex-1 overflow-y-auto px-0">{children}</main>
    </div>
  );
}