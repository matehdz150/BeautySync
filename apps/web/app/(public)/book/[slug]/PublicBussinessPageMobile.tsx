"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Share2, Star, MapPin, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePublicBooking } from "@/context/PublicBookingContext";
import { CategoryIcon } from "@/components/shared/Icon";
import { BranchMapSectionMobile } from "@/components/book/publicPageBussines/BranchMapSectionMobile";

/* =====================
   TYPES
===================== */

type Image = {
  id: string;
  url: string;
  isCover?: boolean;
};

type Service = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number | null;
  category: {
    id: string;
    name: string;
    icon: string;
    hexColor: string;
  } | null;
};

type CategoryTab = {
  id: string;
  label: string;
  icon?: string | null;
};

/* =====================
   HELPERS
===================== */

function buildCategoryTabs(services: Service[]): CategoryTab[] {
  const map = new Map<string, CategoryTab>();

  for (const s of services) {
    const c = s.category;
    if (!c?.id) continue;

    if (!map.has(c.id)) {
      map.set(c.id, {
        id: c.id,
        label: c.name ?? "Categoría",
        icon: c.icon ?? null,
      });
    }
  }

  return Array.from(map.values());
}

function formatMoneyMXN(cents: number) {
  return `$${Math.round(cents / 100)} MXN`;
}

function resolveImages(realImages: Image[] = [], fallbackImages: Image[]) {
  const MAX_IMAGES = 7;
  const slots = [...fallbackImages];

  if (realImages.length === 0) return slots.slice(0, MAX_IMAGES);

  const cover = realImages.find((i) => i.isCover);
  if (cover) slots[0] = cover;

  const rest = realImages.filter((i) => !i.isCover);
  rest.forEach((img, idx) => {
    if (idx + 1 < MAX_IMAGES) slots[idx + 1] = img;
  });

  return slots.slice(0, MAX_IMAGES);
}

function formatDuration(min: number) {
  if (!min) return "—";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/* =====================
   MOBILE PAGE
===================== */

export default function PublicBusinessMobilePage() {
  const { branch } = usePublicBooking();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const DEMO_IMAGES: Image[] = [
    {
      id: "demo-1",
      url: "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=2070&auto=format&fit=crop",
      isCover: true,
    },
    {
      id: "demo-2",
      url: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=2070&auto=format&fit=crop",
    },
    {
      id: "demo-3",
      url: "https://images.unsplash.com/photo-1706629504952-ab5e50f5c179?q=80&w=2070&auto=format&fit=crop",
    },
    {
      id: "demo-4",
      url: "https://images.unsplash.com/photo-1634449862841-8c6e970117e5?q=80&w=983&auto=format&fit=crop",
    },
    {
      id: "demo-5",
      url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=2069&auto=format&fit=crop",
    },
    {
      id: "demo-6",
      url: "https://images.unsplash.com/photo-1562095693-c517d3352e97?q=80&w=1481&auto=format&fit=crop",
    },
    {
      id: "demo-7",
      url: "https://images.unsplash.com/photo-1666533424151-aae0a59469d1?q=80&w=1035&auto=format&fit=crop",
    },
  ];

  const resolvedImages = useMemo(() => {
    return resolveImages(branch?.images ?? [], DEMO_IMAGES);
  }, [DEMO_IMAGES, branch?.images]);

  const cover = resolvedImages[0];
  const services = (branch?.services ?? []) as Service[];

  const ratingValue = branch?.rating?.average;
  const ratingCount = branch?.rating?.count;

  const openLabel = "Abierto";
  const closeLabel = "hasta las 19:00";

  // ✅ tabs reales por categoría
  const categoryTabs = useMemo(() => buildCategoryTabs(services), [services]);

  const tabs = useMemo(() => {
    return [{ id: "all", label: "Destacados", icon: null }, ...categoryTabs];
  }, [categoryTabs]);

  const [activeTab, setActiveTab] = useState<string>("all");

  // ✅ filtrar servicios por tab
  const filteredServices = useMemo(() => {
    if (activeTab === "all") return services;
    return services.filter((s) => s.category?.id === activeTab);
  }, [services, activeTab]);

  // ✅ máximo 5 visibles
  const visibleServices = useMemo(() => {
    return filteredServices.slice(0, 5);
  }, [filteredServices]);

  const minPriceCents = useMemo(() => {
  const prices = services
    .map((s) => s.priceCents)
    .filter((p): p is number => typeof p === "number" && p > 0);

  if (prices.length === 0) return null;

  return Math.min(...prices);
}, [services]);

  return (
    <div className="min-h-dvh bg-gray-50">
      <input ref={fileRef} type="file" hidden />

      {/* =====================
          HERO IMAGE (FULL WIDTH)
      ===================== */}
      <div className="relative w-screen left-1/2 -translate-x-1/2">
        <div className="relative h-[320px] w-screen bg-gray-100 overflow-hidden">
          {cover?.url ? (
            <img
              src={cover.url}
              alt=""
              className="h-full w-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
              Sin imagen
            </div>
          )}

          {/* top bar */}
          <div className="absolute inset-x-0 top-0 z-20 px-4 pt-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.back()}
                className={cn(
                  "h-10 w-10 rounded-full",
                  "bg-white/90 backdrop-blur-md",
                  "border border-black/10",
                  "flex items-center justify-center"
                )}
                aria-label="Volver"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={cn(
                    "h-10 w-10 rounded-full",
                    "bg-white/90 backdrop-blur-md",
                    "border border-black/10",
                    "flex items-center justify-center"
                  )}
                  aria-label="Compartir"
                >
                  <Share2 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  className={cn(
                    "h-10 w-10 rounded-full",
                    "bg-white/90 backdrop-blur-md",
                    "border border-black/10",
                    "flex items-center justify-center"
                  )}
                  aria-label="Favorito"
                >
                  <Heart className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* pager */}
          <div className="absolute bottom-3 right-3 z-20">
            <div className="rounded-full bg-black/60 px-3 py-1 text-xs text-white">
              1/{Math.max(resolvedImages.length, 1)}
            </div>
          </div>

          {/* gradient */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/25 to-transparent" />
        </div>

        {/* =====================
            INFO CARD
        ===================== */}
        <div className="relative z-10 -mt-8 px-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)]"
          >
            <h1 className="text-2xl font-semibold tracking-tight">
              {branch?.name ?? "—"}
            </h1>

            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-amber-500">
                <Star className="h-4 w-4 fill-amber-500" />
                <span className="text-black font-medium">
                  {ratingValue.toFixed(1)}
                </span>
              </span>

              <span className="text-muted-foreground">({ratingCount})</span>
            </div>

            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{branch?.address ?? "—"}</span>
            </div>

            <div className="mt-2 flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-emerald-600 font-medium">{openLabel}</span>
              <span className="text-muted-foreground">{closeLabel}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* =====================
    SERVICES
===================== */}
      <div className="pb-28 w-full">
        {/* title */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold ml-4">Servicios</h2>
        </div>

        {/* tabs */}
        <div className="mt-4 sticky top-0 z-30 bg-transparent backdrop-blur-md border-b border-black/5">
          <div className="flex gap-2 overflow-x-auto py-3 px-4 no-scrollbar">
            {tabs.map((t) => {
              const isActive = activeTab === t.id;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition flex items-center gap-2",
                    isActive
                      ? "bg-black text-white"
                      : "bg-black/5 text-black hover:bg-black/10"
                  )}
                >
                  <span className="whitespace-nowrap">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* list FULL WIDTH */}
        <div className="mt-0 w-screen left-1/2 -translate-x-1/2 relative">
          {visibleServices.map((service) => (
            <div
              key={service.id}
              className="w-full border-b border-black/5 px-4 py-4 bg-white"
            >
              <div className="flex items-center justify-between gap-4 w-full">
                <div className="min-w-0 flex items-start gap-3">
                  {/* icon */}
                  <div className="h-10 w-10 rounded-full border border-black/10 flex items-center justify-center bg-white shrink-0">
                    <CategoryIcon
                      name={service.category?.icon}
                      className="w-5 h-5 text-indigo-400"
                    />
                  </div>

                  {/* info */}
                  <div className="min-w-0">
                    <p className="text-base font-medium truncate">
                      {service.name}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground font-light">
                      {formatDuration(service.durationMin)}
                    </p>

                    <p className="mt-2 text-sm text-black">
                      {service.priceCents
                        ? formatMoneyMXN(service.priceCents)
                        : "Gratis"}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="rounded-full px-5 shrink-0"
                  onClick={() => {
                    router.push(`/book/${branch?.slug}/b/services`);
                    window.scrollTo(0, 0);
                  }}
                >
                  Reservar
                </Button>
              </div>
            </div>
          ))}

          {filteredServices.length === 0 && (
            <div className="px-4 py-5">
              <div className="rounded-2xl border border-black/10 bg-white p-5">
                <p className="text-sm font-medium">Sin servicios por ahora</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Este negocio aún no tiene servicios públicos activos.
                </p>
              </div>
            </div>
          )}

          {filteredServices.length > 0 && (
            <p className="px-4 pt-2 text-sm text-muted-foreground">
              {filteredServices.length} servicios disponibles
            </p>
          )}
        </div>
        <BranchMapSectionMobile
          lat={branch?.lat}
          lng={branch?.lng}
          description={branch?.description}
        />
      </div>

      {/* =====================
          BOTTOM BAR CTA
      ===================== */}
      <div className="fixed inset-x-0 bottom-0 z-40">
        {/* bar */}
        <div className="border-t border-black/10 bg-white pt-2">
          <div className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+15px)]">
            <div className="flex items-center justify-between gap-4">
              {/* left info */}
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Desde</p>

                <p className="text-lg font-semibold leading-tight truncate">
                  {minPriceCents ? formatMoneyMXN(minPriceCents) : "0.00 MXN"}
                </p>
              </div>

              {/* CTA */}
              <Button
                size="lg"
                className={cn(
                  "rounded-full px-6 py-6 text-base font-semibold",
                )}
                onClick={() => {
                  router.push(`/book/${branch?.slug}/b/services`);
                  window.scrollTo(0, 0);
                }}
              >
                Reservar ahora
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
