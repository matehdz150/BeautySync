"use client";

import { useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Star, Heart, Share2, MapPin, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePublicBooking } from "@/context/PublicBookingContext";
import { CategoryIcon } from "@/components/shared/Icon";
import { BranchMapSection } from "@/components/book/publicPageBussines/BranchMapSection";

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

/* =====================
   ANIMATIONS (editorial, subtle)
===================== */

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

/* =====================
   HELPERS
===================== */

function formatMoneyMXN(cents: number) {
  return `$${Math.round(cents / 100)} MXN`;
}

function resolveImages(realImages: Image[] = [], fallbackImages: Image[]) {
  const MAX_IMAGES = 5;
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

/* =====================
   PAGE
===================== */

export default function PublicBusinessPage() {
  const { branch } = usePublicBooking();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

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
  ];

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const resolvedImages = useMemo(() => {
    return resolveImages(branch?.images ?? [], DEMO_IMAGES);
  }, [branch?.images]);

  const cover = resolvedImages[0];
  const services = (branch?.services ?? []) as Service[];

  const ratingValue = 5.0;
  const ratingCount = 17;

  const openLabel = "Abierto hasta 20:00";
  const nextOpenLabel = "— abre el miércoles a las 10:00";

  console.log(branch);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={stagger}
      className="bg-transparent"
    >
      <input ref={fileRef} type="file" hidden />

      {/* =====================
          TOP CONTAINER (WIDER)
      ===================== */}
      <div className="mx-auto w-full max-w-380 px-15 2xl:px-18 py-5">
        {/* =====================
            HEADER
        ===================== */}
        <motion.header variants={fadeUp} className="space-y-6">
          <div className="flex items-start justify-between gap-8">
            <div className="min-w-0">
              <p className="text-xs tracking-[0.22em] uppercase text-muted-foreground">
                Establecimiento
              </p>

              <h1 className="mt-3 text-5xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
                {branch?.name ?? "—"}
              </h1>

              <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-0 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-amber-500">
                    <Star className="w-5 h-5 fill-amber-500" />
                    <span className="text-black font-semibold text-base">
                      {ratingValue.toFixed(1)}
                    </span>
                  </span>

                  <span className="text-lg text-indigo-400">
                    ({ratingCount})
                  </span>
                </div>

                <span className="text-black text-2xl">• </span>

                <span className="text-black text-lg font-light">{openLabel}</span>

                <span className="text-black text-2xl">• </span>

                <span className="truncate max-w-[680px] text-lg font-light">
                  {branch?.address ?? "—"}
                </span>

 
              </div>
            </div>

            {/* actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                className="h-13 w-13 rounded-full shadow-none"
                variant="outline"
                aria-label="Compartir"
                tooltip='Compartir'
              >
                <Share2 className="w-6 h-6" />
              </Button>

              <Button
                className="h-13 w-13 rounded-full shadow-none"
                variant="outline"
                aria-label="Favoritos"
                tooltip='Favoritos'
                
              >
                <Heart className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </motion.header>

        {/* =====================
            IMAGES (FIXED PRO GRID)
            - Soluciona lo de la "primera imagen"
            - Proporción editorial como referencia
        ===================== */}
        <motion.section variants={fadeUp} className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* HERO */}
            <div className="lg:col-span-8">
              <EditorialImage
                image={cover}
                className="h-[420px] lg:h-[520px]"
                priority
              />
            </div>

            {/* RIGHT STACK */}
            <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-2 gap-3 h-[420px] lg:h-[520px]">
              <EditorialImage image={resolvedImages[1]} className="h-full" />
              <EditorialImage image={resolvedImages[2]} className="h-full" />
              <EditorialImage image={resolvedImages[3]} className="h-full" />
              <EditorialImage image={resolvedImages[4]} className="h-full" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span className="uppercase tracking-[0.22em]">Galería</span>
            <span>{resolvedImages.length} fotos</span>
          </div>
        </motion.section>

        {/* =====================
            CONTENT GRID
        ===================== */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 items-start">
          {/* =====================
              LEFT: SERVICES
          ===================== */}
          <motion.section variants={fadeUp} className="min-w-0">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-xs tracking-[0.22em] uppercase text-muted-foreground">
                  Catálogo
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  Servicios disponibles
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Elige tu servicio. Nosotros hacemos el resto.
                </p>
              </div>

              <Button variant="outline" className="rounded-full px-5">
                Ver todo
              </Button>
            </div>

            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="mt-8 space-y-3"
            >
              {services.slice(0, 6).map((service) => (
                <motion.div key={service.id} variants={fadeUp}>
                  <ServiceRow service={service} />
                </motion.div>
              ))}

              {services.length === 0 && (
                <div className="rounded-2xl border border-black/10 bg-white p-5">
                  <p className="text-sm font-medium">Sin servicios por ahora</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Este negocio aún no tiene servicios públicos activos.
                  </p>
                </div>
              )}
            </motion.div>
            <BranchMapSection
              className="mt-10"
              lat={branch?.lat}
              lng={branch?.lng}
              adress={branch?.address}
              description={branch?.description}
            />
          </motion.section>

          {/* =====================
              RIGHT: BOOKING CARD (sticky)
          ===================== */}
          <motion.aside
            variants={fadeUp}
            className="hidden lg:block self-stretch"
          >
            {/* ✅ Este wrapper hace que la columna derecha tenga la misma altura que la izquierda */}
            <div className="relative h-full">
              {/* ✅ Sticky dura todo el alto del aside (que ahora es “largo”) */}
              <div className="sticky top-24">
                <div className="rounded-3xl border border-black/10 bg-white p-6">
                  <p className="text-xs tracking-[0.22em] uppercase text-muted-foreground">
                    Reserva
                  </p>

                  <h3 className="mt-3 text-2xl font-semibold leading-tight">
                    {branch?.name ?? "—"}
                  </h3>

                  <div className="mt-4 flex items-center gap-3">
                    <span className="flex items-center gap-1 text-amber-500">
                      <Star className="w-4 h-4 fill-amber-500" />
                      <span className="text-black font-medium">
                        {ratingValue.toFixed(1)}
                      </span>
                    </span>

                    <span className="text-xs text-muted-foreground">
                      ({ratingCount} reseñas)
                    </span>
                  </div>

                  <Button
                    size="lg"
                    className="mt-6 w-full rounded-full py-6 text-base"
                    onClick={() => {
                      router.push(`/book/${branch?.slug}/b/services`);
                      window.scrollTo(0, 0);
                    }}
                  >
                    Reservar ahora
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <div className="mt-6 h-px w-full bg-black/10" />

                  <div className="mt-6 space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <p className="leading-snug">
                        <span className="font-medium text-black">Cerrado</span>{" "}
                        <span className="text-muted-foreground">
                          {nextOpenLabel}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <p className="leading-snug text-muted-foreground">
                        {branch?.address ?? "—"}{" "}
                        <span className="text-indigo-600 font-medium cursor-pointer underline underline-offset-4">
                          Cómo llegar
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4">
                    <p className="text-xs text-muted-foreground">Nota</p>
                    <p className="text-sm font-medium mt-1">
                      Reserva tu espacio.
                      <span className="text-muted-foreground">
                        {" "}
                        Lo demás se acomoda.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>

        <div className="h-10" />
      </div>
    </motion.div>
  );
}

/* =====================
   COMPONENTS
===================== */

function EditorialImage({
  image,
  className,
  priority,
}: {
  image?: Image;
  className?: string;
  priority?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "relative w-full overflow-hidden rounded-3xl border border-black/10 bg-gray-100",
        className
      )}
    >
      {image?.url ? (
        <motion.img
          src={image.url}
          alt=""
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          loading={priority ? "eager" : "lazy"}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
          Sin imagen
        </div>
      )}
    </motion.div>
  );
}

function ServiceRow({ service }: { service: Service }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white px-5 py-4">
      <div className="flex items-start justify-between gap-5">
        {/* LEFT */}
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full border border-black/10 flex items-center justify-center bg-white">
              <CategoryIcon
                name={service.category?.icon}
                className="w-5 h-5 text-indigo-400"
              />
            </div>

            <div className="min-w-0">
              <p className="font-medium truncate">{service.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {service.durationMin} min
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-sm font-semibold">
              {service.priceCents
                ? formatMoneyMXN(service.priceCents)
                : "Gratis"}
            </p>
            <p className="text-xs text-muted-foreground">por sesión</p>
          </div>

          <motion.div whileTap={{ scale: 0.98 }}>
            <Button variant="outline" size="sm" className="rounded-full">
              Reservar
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
