"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function BookingConfirmSplash({
  open,
  title = "Cita confirmada",
}: {
  open: boolean;
  title?: string;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[999] bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* GLOW ESTÁTICO (sin animación) */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute left-4/12 top-30",
              "h-125 w-255 -translate-x-1/2 z-0 rounded-full blur-3xl",
              "bg-gradient-to-b from-indigo-400/75 via-indigo-400/30 to-transparent"
            )}
            style={{
              filter: "blur(70px)",
            }}
          />
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute left-9/12 top-50",
              "h-175 w-205 -translate-x-1/2 z-0 rounded-full blur-3xl",
              "bg-gradient-to-b from-indigo-400/75 via-indigo-400/30 to-transparent"
            )}
            style={{
              filter: "blur(70px)",
            }}
          />

          {/* CONTENT */}
          <motion.div
            className="relative z-10 h-full w-full flex flex-col items-center justify-center px-6 text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {/* Check */}
            <motion.div
              initial={{ scale: 0.85 }}
              animate={{ scale: [0.9, 1.08, 1] }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className={cn(
                "h-20 w-20 rounded-full",
                "bg-indigo-400 backdrop-blur-xl",
                "border border-black/10",
                "shadow-[0_24px_80px_-40px_rgba(99,102,241,0.55)]",
                "flex items-center justify-center"
              )}
            >
              <div className="h-12 w-12 rounded-full bg-indigo-400 flex items-center justify-center shadow-sm">
                <Check className="h-9 w-9 text-white" strokeWidth={3} />
              </div>
            </motion.div>

            {/* Title */}
            <motion.p
              className="mt-5 text-xl font-semibold tracking-tight text-black"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.22, ease: "easeOut" }}
            >
              {title}
            </motion.p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}