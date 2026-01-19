"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function BookingConfirmSplash({
  open,
  title = "Cita confirmada",
  subtitle = "Estamos guardando tu reservación…",
}: {
  open: boolean;
  title?: string;
  subtitle?: string;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[999] overflow-hidden bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {/* Background soft gradient */}
          <div
            aria-hidden
            className={cn(
              "absolute inset-0",
              "bg-[radial-gradient(circle_at_20%_15%,rgba(99,102,241,0.18),transparent_45%),radial-gradient(circle_at_80%_35%,rgba(99,102,241,0.14),transparent_50%),radial-gradient(circle_at_50%_90%,rgba(0,0,0,0.05),transparent_55%)]"
            )}
          />

          {/* Animated glow blobs */}
          <motion.div
            aria-hidden
            className={cn(
              "pointer-events-none absolute -top-24 left-1/2 h-[320px] w-[520px] -translate-x-1/2 rounded-full",
              "bg-gradient-to-b from-indigo-400/60 via-indigo-400/25 to-transparent blur-3xl"
            )}
            style={{ filter: "blur(80px)" }}
            initial={{ opacity: 0.0, scale: 0.95, y: -10 }}
            animate={{
              opacity: 1,
              scale: [0.98, 1.02, 0.99],
              y: [0, 10, 0],
            }}
            transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity }}
          />

          <motion.div
            aria-hidden
            className={cn(
              "pointer-events-none absolute top-[35%] left-[75%] h-[280px] w-[360px] -translate-x-1/2 rounded-full",
              "bg-gradient-to-b from-indigo-400/55 via-indigo-400/20 to-transparent blur-3xl"
            )}
            style={{ filter: "blur(85px)" }}
            initial={{ opacity: 0.0, scale: 0.95 }}
            animate={{
              opacity: 1,
              scale: [0.98, 1.03, 1.0],
              x: [0, -12, 0],
              y: [0, 14, 0],
            }}
            transition={{ duration: 2.6, ease: "easeInOut", repeat: Infinity }}
          />

          {/* Subtle noise overlay */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E\")",
            }}
          />

          {/* CONTENT */}
          <motion.div
            className="relative z-10 flex h-full w-full items-center justify-center px-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <motion.div
              className={cn(
                "w-full max-w-[420px]",
                "rounded-[28px] border border-black/10 bg-white/75",
                "shadow-[0_30px_120px_-60px_rgba(99,102,241,0.45)]",
                "backdrop-blur-xl"
              )}
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <div className="px-6 py-7 text-center">
                {/* Check bubble */}
                <motion.div
                  className="mx-auto flex h-[88px] w-[88px] items-center justify-center rounded-full"
                  initial={{ scale: 0.85 }}
                  animate={{ scale: [0.92, 1.06, 1] }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <div
                    className={cn(
                      "relative flex h-[88px] w-[88px] items-center justify-center rounded-full",
                      "bg-indigo-400",
                      "shadow-[0_24px_90px_-45px_rgba(99,102,241,0.75)]"
                    )}
                  >
                    {/* ring pulse */}
                    <motion.div
                      aria-hidden
                      className="absolute inset-0 rounded-full border border-white/40"
                      initial={{ opacity: 0.0, scale: 0.9 }}
                      animate={{ opacity: [0.0, 0.55, 0.0], scale: [0.92, 1.18, 1.28] }}
                      transition={{
                        duration: 1.1,
                        ease: "easeOut",
                        repeat: Infinity,
                        repeatDelay: 0.25,
                      }}
                    />

                    <Check className="h-10 w-10 text-white" strokeWidth={3} />
                  </div>
                </motion.div>

                {/* Title */}
                <motion.p
                  className="mt-5 text-[22px] font-semibold tracking-tight text-black"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06, duration: 0.22, ease: "easeOut" }}
                >
                  {title}
                </motion.p>

                {/* Subtitle */}
                {subtitle ? (
                  <motion.p
                    className="mt-2 text-sm text-black/55"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12, duration: 0.22, ease: "easeOut" }}
                  >
                    {subtitle}
                  </motion.p>
                ) : null}

                {/* little loading dots */}
                <motion.div
                  className="mt-5 flex items-center justify-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.18, duration: 0.2 }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-2 w-2 rounded-full bg-indigo-400/80"
                      animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
                      transition={{
                        duration: 0.75,
                        ease: "easeInOut",
                        repeat: Infinity,
                        delay: i * 0.12,
                      }}
                    />
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}