"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Bell,
  Calendar,
  ChevronDown,
  Contact,
  Heart,
  LogOut,
  Settings,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePublicAuth } from "@/context/public/PublicAuthContext";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const { user, loading, logout } = usePublicAuth();
  const bookingsCount = 3;

  return (
    <header className="sticky top-0 z-50 w-full bg-transparent backdrop-blur-md">
      {/* DESKTOP */}
      <div className="hidden md:flex mx-auto px-15 py-2 h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <span className="font-semibold text-3xl tracking-tight">BeautySync</span>
        </Link>

        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <>
              <Link href="/me/bookings" className="relative inline-flex">
                <Button
                  variant="outline"
                  className="h-11 w-11 rounded-full p-0 shadow-none relative"
                >
                  <Calendar className="h-5 w-5" />
                </Button>

                {bookingsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-black text-white text-[11px] font-semibold flex items-center justify-center">
                    {bookingsCount > 99 ? "99+" : bookingsCount}
                  </span>
                )}
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="group flex items-center gap-3 rounded-full px-3 py-2 hover:bg-black/5 transition border bg-white">
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt="avatar"
                        width={36}
                        height={36}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-black/10" />
                    )}

                    <span className="text-sm font-medium">
                      {user.name ?? user.email ?? "Cuenta"}
                    </span>

                    <ChevronDown
                      strokeWidth={1.5}
                      className="h-4 w-4 text-black/60 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180"
                    />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-70 rounded-2xl">
                  <DropdownMenuLabel className="truncate text-base">
                    {user.name ?? user.email ?? "Mi cuenta"}
                  </DropdownMenuLabel>

                  <DropdownMenuItem asChild>
                    <Link
                      href="/me/profile"
                      className="flex items-center gap-2 text-lg"
                    >
                      <Contact className="h-5 w-5" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href="/me/bookings"
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Reservaciones
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href="/me/favorites"
                      className="flex items-center gap-2"
                    >
                      <Bell className="h-4 w-4" />
                      Notificaciones
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href="/me/favorites"
                      className="flex items-center gap-2"
                    >
                      <Heart className="h-4 w-4" />
                      Favoritos
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href="/me/settings"
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Ajustes
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link href="/me/help" className="flex items-center gap-2">
                      Ayuda y soporte
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={logout}
                    className="flex items-center gap-2"
                  >
                    Cerrar sesión
                  </DropdownMenuItem>

                  <DropdownMenuItem className="flex items-center gap-2 font-medium justify-between">
                    Registra tu negocio
                    <ArrowRight className="text-black" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="rounded-full border py-6 px-6 shadow-none"
                >
                  Iniciar sesión
                </Button>
              </Link>

              <Link href="/register">
                <Button className="rounded-full px-6 py-6">Registrarse</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* MOBILE */}
      <div className="flex md:hidden mx-auto px-4 h-16 items-center justify-between bg-transparent">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="font-semibold text-2xl tracking-tight">BeautySync</span>
        </Link>

        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group flex items-center gap-2 rounded-full px-2 py-1 hover:bg-black/5 transition border bg-white">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt="avatar"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-black/10" />
                  )}

                  <span className="max-w-20 truncate text-sm font-medium">
                    {user.name ?? user.email ?? "Cuenta"}
                  </span>

                  <ChevronDown
                    strokeWidth={1.5}
                    className="h-4 w-4 text-black/60 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180"
                  />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className={cn(
                  "w-56 rounded-2xl border border-black/10 bg-white p-1 shadow-xl",
                  "origin-top-right",
                  "data-[state=open]:animate-in data-[state=closed]:animate-out",
                  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                  "data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1"
                )}
              >
                <DropdownMenuLabel className="truncate text-base font-semibold py-2 px-2">
                  {user.name ?? user.email ?? "Mi cuenta"}
                </DropdownMenuLabel>

                <DropdownMenuItem asChild>
                  <Link href="/me/profile" className="flex items-center gap-2">
                    <Contact className="h-5 w-5" />
                    Perfil
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/me/bookings" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Reservaciones
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    href="/me/favorites"
                    className="flex items-center gap-2"
                  >
                    <Heart className="h-4 w-4" />
                    Favoritos
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/me/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Ajustes
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/me/help" className="flex items-center gap-2">
                    Ayuda y soporte
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={logout}
                  className="flex items-center gap-2"
                >
                  Cerrar sesión
                </DropdownMenuItem>

                <DropdownMenuItem className="flex items-center gap-2 font-medium justify-between">
                  Registra tu negocio
                  <ArrowRight className="text-black" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-black transition"
              >
                Iniciar sesión
              </Link>

              <Link href="/register">
                <Button className="rounded-full h-10 px-5 text-sm">
                  Registrarse
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
