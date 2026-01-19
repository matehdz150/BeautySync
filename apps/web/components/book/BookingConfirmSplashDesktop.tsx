"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function BookingConfirmSplashDesktop({
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
          className="fixed inset-0 z-[999] hidden md:block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-white" />

          {/* Animated glow blobs */}
          <motion.div
            aria-hidden
            className={cn(
              "pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px]",
              "-translate-x-1/2 rounded-full blur-3xl"
            )}
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(99,102,241,0.55) 0%, rgba(99,102,241,0.22) 35%, rgba(255,255,255,0) 70%)",
              filter: "blur(80px)",
            }}
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{
              opacity: 1,
              scale: [0.96, 1.02, 0.98, 1],
              y: [0, 10, -6, 0],
            }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 3.2, ease: "easeInOut", repeat: Infinity }}
          />

          <motion.div
            aria-hidden
            className={cn(
              "pointer-events-none absolute -bottom-48 left-[20%] h-[520px] w-[720px]",
              "rounded-full blur-3xl"
            )}
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(99,102,241,0.45) 0%, rgba(99,102,241,0.18) 40%, rgba(255,255,255,0) 72%)",
              filter: "blur(90px)",
            }}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{
              opacity: 1,
              scale: [0.98, 1.04, 1.0, 1.02],
              x: [0, 22, -10, 0],
              y: [0, -18, 10, 0],
            }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 4.0, ease: "easeInOut", repeat: Infinity }}
          />

          <motion.div
            aria-hidden
            className={cn(
              "pointer-events-none absolute top-[18%] right-[8%] h-[420px] w-[520px]",
              "rounded-full blur-3xl"
            )}
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(99,102,241,0.35) 0%, rgba(99,102,241,0.14) 45%, rgba(255,255,255,0) 75%)",
              filter: "blur(80px)",
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              scale: [1, 1.06, 1.01, 1.04],
              rotate: [0, 2, -1, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3.6, ease: "easeInOut", repeat: Infinity }}
          />

          {/* Soft vignette */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 45%, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 55%, rgba(0,0,0,0.04) 100%)",
            }}
          />

          {/* CONTENT */}
          <motion.div
            className="relative z-10 flex h-full w-full items-center justify-center px-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <motion.div
              className={cn(
                "w-full max-w-[560px] rounded-[32px]",
                "border border-black/10 bg-white/70 backdrop-blur-xl",
                "shadow-[0_40px_120px_-60px_rgba(0,0,0,0.35)]",
                "px-10 py-10 text-center"
              )}
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {/* Check */}
              <motion.div
                className={cn(
                  "mx-auto flex h-[92px] w-[92px] items-center justify-center rounded-full",
                  "border border-black/10",
                  "shadow-[0_24px_80px_-40px_rgba(99,102,241,0.55)]"
                )}
                style={{
                  background:
                    "linear-gradient(180deg, rgba(99,102,241,0.95) 0%, rgba(99,102,241,0.70) 100%)",
                }}
                initial={{ scale: 0.86, opacity: 0 }}
                animate={{ scale: [0.9, 1.08, 1], opacity: 1 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                <div
                  className={cn(
                    "flex h-[56px] w-[56px] items-center justify-center rounded-full",
                    "shadow-sm"
                  )}
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(99,102,241,1) 0%, rgba(99,102,241,0.85) 100%)",
                  }}
                >
                  <Check className="h-9 w-9 text-white" strokeWidth={3} />
                </div>
              </motion.div>

              {/* Title */}
              <motion.p
                className="mt-6 text-2xl font-semibold tracking-tight text-black"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.22, ease: "easeOut" }}
              >
                {title}
              </motion.p>

              {/* Subtitle */}
              <motion.p
                className="mt-2 text-sm text-black/55"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.22, ease: "easeOut" }}
              >
                {subtitle}
              </motion.p>

              {/* Loading shimmer bar */}
              <motion.div
                className="mx-auto mt-7 h-[10px] w-full max-w-[320px] overflow-hidden rounded-full bg-black/[0.06]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.12, duration: 0.22 }}
              >
                <motion.div
                  className="h-full w-[42%] rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(99,102,241,0.0) 0%, rgba(99,102,241,0.75) 50%, rgba(99,102,241,0.0) 100%)",
                  }}
                  animate={{ x: ["-60%", "260%"] }}
                  transition={{
                    duration: 1.05,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}