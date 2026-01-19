"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  lat: string | number | null | undefined;
  lng: string | number | null | undefined;

  adress?: string | null | undefined;
  description?: string | null | undefined;

  className?: string;
};

const BranchMapStatic = dynamic(() => import("./_BranchMapStatic"), {
  ssr: false,
});

export function BranchMapSectionMobile({
  lat,
  lng,
  adress,
  description,
  className,
}: Props) {
  const latNum = typeof lat === "string" ? Number(lat) : lat;
  const lngNum = typeof lng === "string" ? Number(lng) : lng;

  const hasLocation = Number.isFinite(latNum) && Number.isFinite(lngNum);
  const hasDescription = !!description?.trim();

  function openDirections() {
    if (!hasLocation) return;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${latNum},${lngNum}&travelmode=driving`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (!hasLocation) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn("w-full", className)}
      >
        <div className="rounded-3xl border border-black/10 bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full border border-black/10 flex items-center justify-center bg-white shrink-0">
              <MapPin className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold">Mapa no disponible</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Este negocio aún no configuró su ubicación.
              </p>
            </div>
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("w-full", className)}
    >
      {/* ========================= */}
      {/* ACERCA DE */}
      {/* ========================= */}
      <div className="mt-6 px-4">
        <h3 className="text-xl font-semibold tracking-tight">Acerca de</h3>

        <p
          className={cn(
            "mt-2 text-sm leading-relaxed text-black/80",
            !hasDescription && "text-muted-foreground italic"
          )}
        >
          {hasDescription
            ? description!.trim()
            : "Este negocio aún no tiene una descripción."}
        </p>
      </div>

      {/* ========================= */}
      {/* MAPA FULL WIDTH */}
      {/* ========================= */}
      <div className="mt-4 relative w-screen left-1/2 -translate-x-1/2 px-2">
        <div className="relative h-[280px] w-full bg-gray-100 overflow-hidden rounded-sm">
          <BranchMapStatic center={{ lat: latNum!, lng: lngNum! }} />

          {/* pin floating */}
          <div className="pointer-events-none absolute top-4 right-4">
            <div className="h-10 w-10 rounded-full bg-white/90 backdrop-blur border border-black/10 flex items-center justify-center shadow-sm">
              <MapPin className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================= */}
      {/* FOOTER */}
      {/* ========================= */}
      <div className="px-4 pt-4">
        <div className="rounded-3xl border border-black/10 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {adress?.trim() ? adress : "Ver ubicación"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {latNum!.toFixed(6)}, {lngNum!.toFixed(6)}
              </p>
            </div>

            <div className="h-10 w-10 rounded-full border border-black/10 flex items-center justify-center bg-white shrink-0">
              <MapPin className="h-5 w-5 text-indigo-400" />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full rounded-full gap-2"
            onClick={openDirections}
          >
            <Navigation className="h-4 w-4" />
            Cómo llegar
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
