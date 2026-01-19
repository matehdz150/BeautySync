"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Calendar,
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

export function PublicHeader() {
  const { user, loading, logout } = usePublicAuth();

  return (
    <header className="sticky top-0 z-50 w-full transparent backdrop-blur-md">
      {/* DESKTOP */}
      <div className="hidden md:flex mx-auto px-10 h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <span className="font-semibold text-2xl tracking-tight">
            BeautySync
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <>
              <Link href="/me/bookings">
                <Button
                  variant="outline"
                  className="rounded-full py-6 px-6 shadow-none"
                >
                  Mis citas
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 rounded-full px-3 py-2 hover:bg-black/5 transition border">
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
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                  <DropdownMenuLabel className="truncate">
                    {user.name ?? user.email ?? "Mi cuenta"}
                  </DropdownMenuLabel>

                  <DropdownMenuItem asChild>
                    <Link
                      href="/me/profile"
                      className="flex items-center gap-2"
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
      <div className="flex md:hidden mx-auto px-4 h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="font-semibold text-lg tracking-tight">
            BeautySync
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-black/5 transition border">
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

                  <span className="max-w-[120px] truncate text-sm font-medium">
                    {user.name ?? user.email ?? "Cuenta"}
                  </span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 rounded-sm">
                <DropdownMenuLabel className="truncate text-base font-semibold py-2">
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
