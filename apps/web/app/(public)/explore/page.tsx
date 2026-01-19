"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchWithDropdown } from "@/components/Explore/SearchWithDrpdown";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function PublicLandingPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSearch() {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/explore/results?${params.toString()}`);
  }

  return (
    <div className="relative min-h-[calc(100dvh-80px)] bg-transparent">

      <div className="mx-auto w-full max-w-[1100px] px-6 py-16">
        {/* HERO */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-center"
        >
          <p className="text-xs tracking-[0.22em] uppercase text-muted-foreground">
            BeautySync — momentos que sí se cumplen
          </p>

          <h1 className="mt-5 text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
            Reserva tu momento
            <br />
            <span className="inline-flex items-center justify-center gap-2">
              sin pensarlo tanto <Sparkles className="w-6 h-6 text-black/70" />
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            No estás buscando “un servicio”.
            <span className="text-black font-medium">
              {" "}
              Estás buscando sentirte bien.
            </span>{" "}
            Encuentra el lugar perfecto y confirma en minutos.
          </p>
        </motion.div>

        {/* SIMPLE SEARCH BAR */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-10"
        >
          <div className="mx-auto max-w-[860px]">
            <SearchWithDropdown/>

            {/* MICRO TRUST LINE */}
            <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span>✓ Reservas sin fricción</span>
              <span>✓ Lugares que se sienten bien</span>
              <span>✓ Confirmación instantánea</span>
            </div>

            {/* MINI “PROMPT IDEAS” */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <QuickChip label="Barbería cerca" onClick={() => setQuery("barbería cerca")} />
              <QuickChip label="Corte ejecutivo" onClick={() => setQuery("corte ejecutivo")} />
              <QuickChip label="Uñas gel" onClick={() => setQuery("uñas gel")} />
              <QuickChip label="Facial glow" onClick={() => setQuery("facial glow")} />
              <QuickChip label="Spa para resetear" onClick={() => setQuery("spa")} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function QuickChip({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-black/10 bg-white/70 backdrop-blur px-4 py-2 text-xs text-muted-foreground hover:text-black transition"
    >
      {label}
    </button>
  );
}