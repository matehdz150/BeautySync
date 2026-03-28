"use client";

import { useMemo, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { getMyFavorites } from "@/lib/services/public/favorites";

/* ========================= */
/* TYPES */
/* ========================= */

type Favorite = {
  id: string;
  name: string;
  category: string;
  locationLabel: string;
  coverUrl?: string | null;
};

/* ========================= */
/* ROW (DESKTOP) */
/* ========================= */

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
        active
          ? "border-black/15 bg-black/[0.02]"
          : "border-black/5 hover:border-black/10 hover:bg-black/[0.01]"
      )}
    >
      <div className="flex gap-3">
        <div className="relative h-[84px] w-[108px] shrink-0 overflow-hidden rounded-l-[18px] border-r border-black/5 bg-black/[0.02]">
          {favorite.coverUrl ? (
            <Image
              src={favorite.coverUrl}
              alt={favorite.name}
              fill
              className="object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Heart className="h-5 w-5 text-indigo-600" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 py-3 pr-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold truncate">
                {favorite.name}
              </p>
              <p className="text-sm text-black/60 truncate">
                {favorite.category} • {favorite.locationLabel}
              </p>
            </div>

            <ChevronRight className="mt-1 h-4 w-4 text-black/30" />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ========================= */
/* ROW (MOBILE CARD) */
/* ========================= */

function FavoriteCard({ favorite }: { favorite: Favorite }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/me/favorites/${favorite.id}`)}
      className="rounded-2xl overflow-hidden bg-white border border-black/5 active:scale-[0.98] transition"
    >
      <div className="relative h-40 w-full">
        {favorite.coverUrl ? (
          <Image
            src={favorite.coverUrl}
            alt={favorite.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100">
            <Heart className="h-6 w-6 text-gray-400" />
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="font-semibold text-sm">{favorite.name}</p>
        <p className="text-xs text-gray-500">
          {favorite.category} • {favorite.locationLabel}
        </p>
      </div>
    </div>
  );
}

/* ========================= */
/* MAIN */
/* ========================= */

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  const activeId = useMemo(() => {
    const m = pathname.match(/\/me\/favorites\/([^/]+)/);
    return m?.[1] ?? null;
  }, [pathname]);

  const isDetailRoute = !!activeId;

  useEffect(() => {
    async function fetchFavorites() {
      try {
        const data = await getMyFavorites();

        const mapped: Favorite[] = data.map((f) => ({
          id: f.branchId,
          name: f.name ?? "Sin nombre",
          category: "Lugar",
          locationLabel: f.address ?? "Sin dirección",
          coverUrl: f.coverImage ?? null,
        }));

        setFavorites(mapped);
      } catch (e) {
        console.error("Error loading favorites:", e);
      } finally {
        setLoadingFavorites(false);
      }
    }

    fetchFavorites();
  }, []);

  if (isMobile === null) return <div>{children}</div>;

  /* ========================= */
  /* 📱 MOBILE VIEW */
  /* ========================= */

  if (isMobile) {
    return (
      <div className="min-h-screen bg-white px-4 py-6">
        {!isDetailRoute && (
          <>
            <h1 className="text-xl font-semibold mb-4">Favoritos</h1>

            {loadingFavorites && (
              <p className="text-sm text-gray-400">
                Cargando favoritos...
              </p>
            )}

            {!loadingFavorites && favorites.length === 0 && (
              <p className="text-sm text-gray-400">
                No tienes favoritos aún
              </p>
            )}

            <div className="grid gap-4">
              {favorites.map((f) => (
                <FavoriteCard key={f.id} favorite={f} />
              ))}
            </div>
          </>
        )}

        {isDetailRoute && children}
      </div>
    );
  }

  /* ========================= */
  /* 💻 DESKTOP (TU DISEÑO ORIGINAL) */
  /* ========================= */

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

        .bs-grid {
          display: grid;
          grid-template-columns: var(--left) 1fr;
          gap: 24px;
          transition: grid-template-columns 320ms ease-out;
        }

        .bs-grid[data-detail="false"] {
          grid-template-columns: 100% 0fr;
        }

        .bs-grid[data-detail="true"] {
          grid-template-columns: 420px 1fr;
        }
      `}</style>

      <div className="w-full">
        <div className="bs-grid" data-detail={isDetailRoute ? "true" : "false"}>
          {/* LEFT */}
          <aside>
            <div className="rounded-[28px] border border-black/5 bg-white p-4">
              <div className="px-2 pb-3">
                <p className="text-lg font-semibold">Favoritos</p>
              </div>

              {loadingFavorites && <p className="px-2">Cargando...</p>}

              {!loadingFavorites && favorites.length === 0 && (
                <p className="px-2">Sin favoritos</p>
              )}

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

          {/* RIGHT */}
          <main
            className={cn(
              !isDetailRoute && "pointer-events-none opacity-0"
            )}
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