"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Settings2, SlidersHorizontal } from "lucide-react";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const BASE = "/dashboard/staff/overview";

  const nav = [
    { label: "Catálogo de staff", href: `${BASE}` },
    { label: "Horarios", href: `${BASE}/schedules` },
    { label: "Especialidades", href: `${BASE}/services` },
    { label: "Invitaciones", href: `${BASE}/invitations` },
    { label: "Rendimiento", href: `${BASE}/metrics` },
    { label: "Auscencias y vacaciones", href: `${BASE}/blockedtimes` },
    { label: "Equipo no activo", href: `${BASE}/unactive` },
  ];

  function isActive(href: string) {
    if (href === BASE) return pathname === BASE;
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-8 py-8">
        {/* HEADER */}
        <header className="sticky top-0 z-40 py-3 ">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold ml-2">Equipo</h1>
            <div className="flex gap-2">
            <Button variant={'default'} className="py-5 px-6 shadow-none">
                Agregar staff
                <Plus/>
            </Button>
            </div>
          </div>
        </header>

        {/* LAYOUT */}
        <div className="flex gap-5">
          
          {/* SIDEBAR */}
          <aside className="w-64">
            <div className="bg-white rounded-2xl border p-4 sticky top-24 max-h-[calc(100vh-96px)] overflow-y-auto">
              
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Staff
              </p>

              <div className="space-y-1">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block w-full text-left px-3 py-2 rounded-md text-sm",
                      isActive(item.href)
                        ? "bg-indigo-400 text-white font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className="flex-1 overflow-hidden min-h-0">
            {children}
          </main>

        </div>
      </div>
    </div>
  );
}