"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const BASE = "/dashboard/services/overview";

  const nav = [
    { label: "Catálogo de servicios", href: `${BASE}` },
    { label: "Productos", href: `${BASE}/products` },
    { label: "Tarjetas de regalo", href: `${BASE}/gift-cards` },
    { label: "Descuentos", href: `${BASE}/discounts` },
  ];

  function isActive(href: string) {
    if (href === BASE) return pathname === BASE;
    return pathname.startsWith(href);
  }

  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen">
      <div className="mx-auto">
        {/* LAYOUT */}
        <div className="flex gap-5">
          {/* SIDEBAR */}
          <aside
            className={cn(
              "relative transition-all duration-300 ease-in-out border-r",
              open ? "w-54" : "w-12"
            )}
          >
            {/* CONTENEDOR */}
            <div
              className={cn(
                "bg-white py-3 px-2 sticky top-0 h-screen overflow-y-auto transition-all duration-300",
                open ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              <div className="flex flex-col px-2 py-5 ">
                <p className="text-lg font-semibold text-black ">Servicios</p>
              </div>

              <div className="space-y-1">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block w-full text-left px-3 py-4 rounded-md text-sm transition-colors",
                      isActive(item.href)
                        ? "bg-indigo-400 text-white"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* BOTÓN TOGGLE */}
            <button
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "absolute top-6 -right-5 z-5 h-10 w-10 rounded-full border bg-white flex items-center justify-center hover:bg-gray-50 transition"
              )}
            >
              {open ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </aside>

          {/* MAIN CONTENT */}
          <main className="flex-1 overflow-hidden min-h-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
