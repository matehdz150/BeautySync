"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const BASE = "/dashboard/public-setup";

  const nav = [
    { label: "Configuración online", href: BASE },
    { label: "Personalizar", href: `${BASE}/design` },
  ];

  function isActive(href: string) {
    if (href === BASE) return pathname === BASE;
    return pathname.startsWith(href);
  }

  const [open, setOpen] = useState(true);

  return (
    // ✅ ALTURA FIJA DEL VIEWPORT
    <div className="h-dvh overflow-hidden bg-gray-50">
      <div className="flex h-full">
        {/* ================= SIDEBAR ================= */}
        <aside
          className={cn(
            "relative border-r bg-white transition-all duration-300 ease-in-out",
            open ? "w-56" : "w-12"
          )}
        >
          {/* CONTENIDO */}
          <div
            className={cn(
              "h-full px-3 py-5 transition-opacity duration-200",
              open ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            <p className="text-lg font-semibold mb-6">
              Presencia pública
            </p>

            <nav className="space-y-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block px-3 py-3 rounded-md text-sm transition-colors",
                    isActive(item.href)
                      ? "bg-indigo-400 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* TOGGLE */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="absolute top-6 -right-5 z-20 h-10 w-10 rounded-full border bg-white flex items-center justify-center shadow hover:bg-gray-50"
          >
            {open ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </aside>

        {/* ================= MAIN ================= */}
        <main
          className="
            flex-1
            min-h-0
            overflow-y-auto
            bg-white
          "
        >
          {children}
        </main>
      </div>
    </div>
  );
}