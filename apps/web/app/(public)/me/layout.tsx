"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import {
  User,
  CalendarDays,
  Heart,
  Settings,
  ChevronRight,
} from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";
import { PublicHeader } from "@/components/book/PublicHeader";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const NAV: NavItem[] = [
  { label: "Perfil", href: "/me/profile", icon: <User className="h-5 w-5" /> },
  {
    label: "Reservaciones",
    href: "/me/bookings",
    icon: <CalendarDays className="h-5 w-5" />,
  },
  {
    label: "Favoritos",
    href: "/me/favorites",
    icon: <Heart className="h-5 w-5" />,
  },
  {
    label: "Ajustes",
    href: "/me/settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

function SidebarLink({ item }: { item: NavItem }) {
  const pathname = usePathname();

  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center justify-between gap-3 rounded-2xl px-4 py-3 transition",
        "hover:bg-black/[0.04]",
        isActive ? "bg-black/[0.06]" : "bg-transparent"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-2xl border transition",
            isActive
              ? "bg-black border-indigo-100 text-white"
              : "bg-white border-black/10 text-black/70 group-hover:text-black"
          )}
        >
          {item.icon}
        </div>

        <div className="min-w-0">
          <p
            className={cn(
              "text-sm font-medium truncate",
              isActive ? "text-black" : "text-black/80"
            )}
          >
            {item.label}
          </p>

          <p className="text-xs text-muted-foreground truncate">
            {item.label === "Perfil"
              ? "Tu información"
              : item.label === "Reservaciones"
              ? "Tus citas"
              : item.label === "Favoritos"
              ? "Guardados"
              : "Preferencias"}
          </p>
        </div>
      </div>

      <ChevronRight
        className={cn(
          "h-4 w-4 transition",
          isActive ? "text-black/50" : "text-black/25 group-hover:text-black/50"
        )}
      />
    </Link>
  );
}

export default function MeLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile(); // boolean | null

  return (
    <>
      <div className="min-h-[calc(100vh-64px)] bg-gray-50">
        <PublicHeader />
        {/* 🔥 IMPORTANTÍSIMO:
            Mientras isMobile === null, renderiza SIEMPRE lo mismo para evitar hydration mismatch */}
        {isMobile === null ? (
          <div className="mx-auto w-full max-w-3xl px-4 py-6">{children}</div>
        ) : isMobile ? (
          /* MOBILE/TABLET */
          <div>{children}</div>
        ) : (
          /* DESKTOP */
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="flex gap-6 py-8">
              {/* Sidebar fijo */}
              <aside className="w-[320px] shrink-0">
                <div className="sticky top-24">
                  <div className="rounded-[28px] border border-black/5 bg-white p-4">
                    <div className="px-2 pb-3">
                      <p className="text-lg font-semibold tracking-tight">
                        Mi cuenta
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Gestiona tu perfil y tus reservaciones.
                      </p>
                    </div>

                    <div className="flex flex-col gap-1">
                      {NAV.map((item) => (
                        <SidebarLink key={item.href} item={item} />
                      ))}
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main */}
              <main className="flex-1 min-w-0">
                <div className="rounded-[28px] border border-black/5 bg-white">
                  <div className="p-6">{children}</div>
                </div>
              </main>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
