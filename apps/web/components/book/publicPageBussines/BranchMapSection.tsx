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

export function BranchMapSection({
  lat,
  lng,
  adress,
  description,
  className,
}: Props) {
  const latNum = typeof lat === "string" ? Number(lat) : lat;
  const lngNum = typeof lng === "string" ? Number(lng) : lng;

  const hasLocation = Number.isFinite(latNum) && Number.isFinite(lngNum);

  function openDirections() {
    if (!hasLocation) return;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${latNum},${lngNum}&travelmode=driving`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const hasDescription = !!description?.trim();

  if (!hasLocation) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn(
          "rounded-3xl bg-white",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full flex items-center justify-center">
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold">Mapa no disponible</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Este negocio aún no configuró su ubicación.
            </p>
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
      className={cn(
        "rounded-3xl bg-white overflow-hidden",
        className
      )}
    >
      {/* ========================= */}
      {/* ACERCA DE (como tu imagen) */}
      {/* ========================= */}
      <div className=" pt-6 pb-5">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
          Acerca de
        </h3>

        <p
          className={cn(
            "mt-3 text-base md:text-lg leading-relaxed text-black/80",
            !hasDescription && "text-muted-foreground italic"
          )}
        >
          {hasDescription
            ? description!.trim()
            : "Este negocio aún no tiene una descripción."}
        </p>
      </div>

      {/* ========================= */}
      {/* MAPA */}
      {/* ========================= */}
      <div className=" pb-6">
        <div className="relative h-[360px] w-full rounded-sm overflow-hidden">
          <BranchMapStatic center={{ lat: latNum!, lng: lngNum! }} />

          {/* Pin icon floating (opcional bonito) */}
          <div className="pointer-events-none absolute top-4 right-4">
            <div className="h-10 w-10 rounded-full bg-white/90 backdrop-blur border border-black/10 flex items-center justify-center shadow-sm">
              <MapPin className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
        </div>

        {/* ========================= */}
        {/* FOOTER (dirección + CTA) */}
        {/* ========================= */}
        <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {adress?.trim() ? adress : "Ver ubicación"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {latNum!.toFixed(6)}, {lngNum!.toFixed(6)}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="rounded-full gap-2 w-full md:w-auto"
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