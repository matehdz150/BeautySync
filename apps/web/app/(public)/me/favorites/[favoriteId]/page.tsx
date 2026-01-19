"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";

import Image from "next/image";
import Link from "next/link";
import { X, Heart, MapPin, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Favorite = {
  id: string;
  name: string;
  category: string;
  locationLabel: string;
  coverUrl?: string | null;
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
        "will-change-transform"
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
  const favoriteId = params?.favoriteId;

  const favorite = useMemo<Favorite>(() => {
    return {
      id: favoriteId ?? "unknown",
      name: "Acetone Nail Bar",
      category: "Uñas",
      locationLabel: "Providencia",
      coverUrl:
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1600&auto=format&fit=crop",
    };
  }, [favoriteId]);

  function handleClose() {
    router.push("/me/favorites");
  }

  return (
    <div className="w-full" key={favorite.id}>
      {/* Animations */}
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

      {/* Cover */}
      <div
        className="relative h-[280px] w-full overflow-hidden bg-black/[0.02]"
        style={{
          animation: "bsCoverIn 420ms ease-out both",
        }}
      >
        {favorite.coverUrl ? (
          <>
            <Image
              src={favorite.coverUrl}
              alt={favorite.name}
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
        ) : null}

        {/* Close */}
        <div
          className="absolute right-5 top-5 z-10"
          style={{
            animation: "bsCloseIn 260ms ease-out both",
            animationDelay: "120ms",
          }}
        >
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={handleClose}
            className={cn(
              "h-10 w-10 rounded-full border"
            )}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div
          className="absolute bottom-6 left-6 right-6"
          style={{
            animation: "bsBodyIn 320ms ease-out both",
            animationDelay: "160ms",
          }}
        >
          <h1 className="text-4xl font-semibold tracking-tight text-white drop-shadow">
            {favorite.name}
          </h1>

          <p className="mt-1 text-sm text-white/85">
            {favorite.category} • {favorite.locationLabel}
          </p>
        </div>
      </div>

      {/* Body */}
      <div
        className="p-8"
        style={{
          animation: "bsBodyIn 380ms ease-out both",
          animationDelay: "120ms",
        }}
      >
        <div
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white"
          style={{
            animation: "bsRowIn 320ms ease-out both",
            animationDelay: "160ms",
          }}
        >
          <Heart className="h-4 w-4" />
          Guardado en favoritos
        </div>

        <h2
          className="mt-6 text-2xl font-semibold tracking-tight text-black"
          style={{
            animation: "bsRowIn 320ms ease-out both",
            animationDelay: "220ms",
          }}
        >
          ¿Qué quieres hacer?
        </h2>

        <p
          className="mt-2 text-base text-muted-foreground"
          style={{
            animation: "bsRowIn 320ms ease-out both",
            animationDelay: "280ms",
          }}
        >
          Puedes reservar, ver ubicación o explorar el perfil del lugar.
        </p>

        <div className="mt-8 space-y-1">
          <ActionRow
            icon={<Calendar className="h-5 w-5" />}
            title="Reservar cita"
            subtitle="Ver disponibilidad"
            href="/explore"
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
            subtitle={favorite.locationLabel}
            href="/explore"
            delayMs={460}
          />
        </div>
      </div>
    </div>
  );
}
