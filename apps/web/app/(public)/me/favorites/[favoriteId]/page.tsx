"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import Image from "next/image";
import Link from "next/link";
import { X, Heart, MapPin, Calendar, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getPublicBranchSummary } from "@/lib/services/public/favorites";

type Branch = {
  id: string;
  name: string;
  address: string | null;
  slug: string | null;
  lat: string | null;
  lng: string | null;
  coverUrl: string | null;
  rating: {
    average: number | null;
    count: number;
  };
  isFavorite: boolean;
};

function ActionRow({
  icon,
  title,
  subtitle,
  href,
  delayMs = 0,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
  delayMs?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-4 rounded-2xl px-2 py-3 transition",
        "hover:bg-black/[0.03] active:scale-[0.99]",
      )}
      style={{
        animation: "bsRowIn 320ms ease-out both",
        animationDelay: `${delayMs}ms`,
      }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold tracking-tight">{title}</p>
        <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
      </div>
    </Link>
  );
}

export default function FavoriteDetailPage() {
  const router = useRouter();
  const params = useParams<{ favoriteId: string }>();
  const branchId = params?.favoriteId;

  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId) return;

    async function fetchData() {
      setLoading(true);
      try {
        const data = await getPublicBranchSummary(branchId);
        setBranch(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [branchId]);

  function handleClose() {
    router.push("/me/favorites");
  }

  if (loading || !branch) {
    return <div className="p-10">Loading...</div>;
  }

  return (
    <div className="w-full" key={branch.id}>
      {/* ========================= */}
      {/* ANIMATIONS (igual) */}
      {/* ========================= */}
      <style jsx global>{`
        @keyframes bsCoverIn {
          from {
            opacity: 0;
            transform: scale(1.015);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes bsOverlayIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes bsCloseIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
        }

        @keyframes bsBodyIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0px);
          }
        }

        @keyframes bsRowIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0px);
          }
        }
      `}</style>

      {/* ========================= */}
      {/* COVER */}
      {/* ========================= */}
      <div
        className="relative h-[240px] md:h-[280px] w-full overflow-hidden bg-black/[0.02]"
        style={{ animation: "bsCoverIn 420ms ease-out both" }}
      >
        {branch.coverUrl && (
          <>
            <Image
              src={branch.coverUrl}
              alt={branch.name}
              fill
              className="object-cover"
              priority
            />

            <div
              className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent"
              style={{
                animation: "bsOverlayIn 360ms ease-out both",
                animationDelay: "60ms",
              }}
            />
          </>
        )}

        {/* CLOSE */}
        <div
          className="absolute right-4 md:right-5 top-4 md:top-5 z-10"
          style={{
            animation: "bsCloseIn 260ms ease-out both",
            animationDelay: "120ms",
          }}
        >
          <Button
            size="icon"
            variant="outline"
            onClick={handleClose}
            className="h-9 w-9 md:h-10 md:w-10 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* TITLE */}
        <div
          className="absolute bottom-4 md:bottom-6 left-4 md:left-6 right-4 md:right-6"
          style={{
            animation: "bsBodyIn 320ms ease-out both",
            animationDelay: "160ms",
          }}
        >
          <h1 className="text-2xl md:text-4xl font-semibold text-white drop-shadow">
            {branch.name}
          </h1>

          <p className="mt-1 text-xs md:text-sm text-white/85 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            {branch.rating.average?.toFixed(1) ?? "0.0"} • {branch.rating.count}{" "}
            reseñas
          </p>
        </div>
      </div>

      {/* ========================= */}
      {/* BODY */}
      {/* ========================= */}
      <div
        className="p-5 md:p-8"
        style={{
          animation: "bsBodyIn 380ms ease-out both",
          animationDelay: "120ms",
        }}
      >
        {/* FAVORITE BADGE */}
        <div
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 md:px-5 py-2 text-xs md:text-sm font-semibold text-white"
          style={{
            animation: "bsRowIn 320ms ease-out both",
            animationDelay: "160ms",
          }}
        >
          <Heart
            className={cn("h-4 w-4", branch.isFavorite ? "fill-white" : "")}
          />
          {branch.isFavorite ? "Guardado en favoritos" : "No es favorito"}
        </div>

        <h2
          className="mt-5 md:mt-6 text-xl md:text-2xl font-semibold"
          style={{
            animation: "bsRowIn 320ms ease-out both",
            animationDelay: "220ms",
          }}
        >
          ¿Qué quieres hacer?
        </h2>

        <p
          className="mt-2 text-sm md:text-base text-muted-foreground"
          style={{
            animation: "bsRowIn 320ms ease-out both",
            animationDelay: "280ms",
          }}
        >
          Puedes reservar, ver ubicación o explorar el perfil del lugar.
        </p>

        <div className="mt-6 md:mt-8 space-y-1">
          <ActionRow
            icon={<Calendar className="h-5 w-5" />}
            title="Reservar cita"
            subtitle="Ver disponibilidad"
            href={`/book/${branch.slug}`}
            delayMs={340}
          />

          <div
            className="h-px bg-black/10 my-2"
            style={{
              animation: "bsRowIn 320ms ease-out both",
              animationDelay: "400ms",
            }}
          />

          <ActionRow
            icon={<MapPin className="h-5 w-5" />}
            title="Ver ubicación"
            subtitle={branch.address ?? "Sin dirección"}
            href={`/book/${branch.slug}`}
            delayMs={460}
          />
        </div>
      </div>
    </div>
  );
}
