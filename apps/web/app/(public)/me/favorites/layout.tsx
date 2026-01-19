"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

type Favorite = {
  id: string;
  name: string;
  category: string;
  locationLabel: string;
  coverUrl?: string | null;
};

function FavoriteRow({
  favorite,
  active,
}: {
  favorite: Favorite;
  active: boolean;
}) {
  return (
    <Link
      href={`/me/favorites/${favorite.id}`}
      className={cn(
        "group block rounded-[18px] border bg-white transition",
        "duration-200 ease-out",
        active
          ? "border-black/15 bg-black/[0.02]"
          : "border-black/5 hover:border-black/10 hover:bg-black/[0.01]"
      )}
    >
      <div className="flex gap-3">
        {/* Thumb */}
        <div className="relative h-[84px] w-[108px] shrink-0 overflow-hidden rounded-l-[18px] border-r border-black/5 bg-black/[0.02]">
          {favorite.coverUrl ? (
            <Image
              src={favorite.coverUrl}
              alt={favorite.name}
              fill
              className={cn(
                "object-cover transition duration-300",
                "group-hover:scale-[1.02]"
              )}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-9 w-9 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Heart className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 py-3 pr-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold tracking-tight truncate">
                {favorite.name}
              </p>
              <p className="text-sm text-black/60 truncate">
                {favorite.category} • {favorite.locationLabel}
              </p>
            </div>

            <ChevronRight
              className={cn(
                "mt-1 h-4 w-4 transition duration-200",
                active
                  ? "text-black/60"
                  : "text-black/25 group-hover:text-black/50 group-hover:translate-x-[1px]"
              )}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // detecta si estás en /me/favorites/[id]
  const activeId = useMemo(() => {
    const m = pathname.match(/\/me\/favorites\/([^/]+)/);
    return m?.[1] ?? null;
  }, [pathname]);

  const isDetailRoute = !!activeId;

  const favorites = useMemo<Favorite[]>(() => {
    return [
      {
        id: "fav_1",
        name: "Acetone Nail Bar",
        category: "Uñas",
        locationLabel: "Providencia",
        coverUrl:
          "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop",
      },
      {
        id: "fav_2",
        name: "Cuerpo Saludable Guadalajara",
        category: "Spa",
        locationLabel: "Andares",
        coverUrl:
          "https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=1200&auto=format&fit=crop",
      },
      {
        id: "fav_3",
        name: "Barbería Midtown",
        category: "Barbería",
        locationLabel: "Midtown",
        coverUrl:
          "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1200&auto=format&fit=crop",
      },
    ];
  }, []);

  // evita hydration mismatch
  if (isMobile === null) return <div>{children}</div>;

  // mobile: normal (sin panel)
  if (isMobile) return <div className="min-h-screen bg-white">{children}</div>;

  return (
    <>
      <style jsx global>{`
        @keyframes bsPanelIn {
          from {
            opacity: 0;
            transform: translateX(14px);
          }
          to {
            opacity: 1;
            transform: translateX(0px);
          }
        }

        /* 🔥 el truco: animar grid-template-columns con una variable */
        .bs-grid {
          display: grid;
          grid-template-columns: var(--left) 1fr;
          gap: 24px;
          transition: grid-template-columns 320ms ease-out;
          will-change: grid-template-columns;
        }

        /* cuando NO hay detail, el panel derecho se colapsa visualmente */
        .bs-grid[data-detail="false"] {
          grid-template-columns: 100% 0fr;
        }

        /* cuando SI hay detail, el panel derecho aparece y la lista se hace sidebar */
        .bs-grid[data-detail="true"] {
          grid-template-columns: 420px 1fr;
        }
      `}</style>

      <div className="w-full">
        <div className="bs-grid" data-detail={isDetailRoute ? "true" : "false"}>
          {/* LEFT: LIST */}
          <aside className="min-w-0">
            <div className="rounded-[28px] border border-black/5 bg-white p-4">
              <div className="px-2 pb-3">
                <p className="text-lg font-semibold tracking-tight">Favoritos</p>
                <p className="text-sm text-muted-foreground">
                  Selecciona uno para ver detalles
                </p>
              </div>

              <div className="space-y-2">
                {favorites.map((f) => (
                  <FavoriteRow
                    key={f.id}
                    favorite={f}
                    active={f.id === activeId}
                  />
                ))}
              </div>
            </div>
          </aside>

          {/* RIGHT: PANEL */}
          <main
            className={cn(
              "min-w-0 overflow-hidden",
              // cuando no hay detail, escondemos el panel de verdad
              !isDetailRoute && "pointer-events-none opacity-0"
            )}
            style={{
              animation: isDetailRoute ? "bsPanelIn 500ms ease-out both" : "none",
            }}
            key={activeId ?? "empty"}
          >
            <div className="rounded-[28px] border border-black/5 bg-white overflow-hidden">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}