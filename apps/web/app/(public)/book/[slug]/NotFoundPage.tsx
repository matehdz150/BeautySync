"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const images = [
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?q=80&w=988&auto=format&fit=crop",
  "https://plus.unsplash.com/premium_photo-1671741519429-c0465c1b5c12?q=80&w=987&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516646720587-727f6728837d?q=80&w=2070&auto=format&fit=crop",
];

export default function NotFound() {
  return (
    <div className="min-h-[80vh] bg-white flex items-center justify-center px-6">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* ================= TEXT ================= */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-6"
        >
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Error 404
          </p>

          <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
            Este lugar <br /> ya no está disponible
          </h1>

          <p className="text-lg text-muted-foreground max-w-md">
            Puede que el negocio haya cambiado su enlace, esté fuera de línea
            o simplemente no exista… pero no te preocupes, hay muchos más
            lugares increíbles esperando por ti.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/">Volver al inicio</Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full"
            >
              <Link href="/explorar">Explorar negocios</Link>
            </Button>
          </div>
        </motion.div>

        {/* ================= COLLAGE ================= */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: { staggerChildren: 0.12 },
            },
          }}
          className="relative h-115 w-full"
        >
          {/* Imagen grande izquierda */}
          <CollageImage
            src={images[3]}
            className="absolute left-0 top-0 h-[65%] w-[55%]"
          />

          {/* Arriba derecha */}
          <CollageImage
            src={images[1]}
            className="absolute right-0 top-0 h-[38%] w-[40%]"
          />

          {/* Centro derecha */}
          <CollageImage
            src={images[2]}
            className="absolute right-[10%] top-[42%] h-[35%] w-[45%]"
          />

          {/* Abajo izquierda */}
          <CollageImage
            src={images[0]}
            className="absolute left-[10%] bottom-0 h-[32%] w-[50%]"
          />
        </motion.div>
      </div>
    </div>
  );
}

/* =====================
   COLLAGE IMAGE
===================== */

function CollageImage({
  src,
  className,
}: {
  src: string;
  className: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.96 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.6, ease: "easeOut" },
        },
      }}
      whileHover={{ scale: 1.03 }}
      className={`rounded-2xl overflow-hidden shadow-lg bg-gray-100 ${className}`}
    >
      <img
        src={src}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </motion.div>
  );
}