"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import {
  getAvailabilityChain,
  type AvailabilityChainPlan,
} from "@/lib/services/public/availability";

import type { PublicBooking } from "@/lib/services/public/appointment";

/* =====================
   ANIMATIONS
===================== */

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.035, delayChildren: 0.02 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, y: 6, transition: { duration: 0.12 } },
};

/* =====================
   TYPES
===================== */

type Props = {
  booking: PublicBooking;
  selectedDate?: string | null;

  selectedPlan?: AvailabilityChainPlan | null;
  onSelectPlan?: (plan: AvailabilityChainPlan) => void;
};

/* =====================
   COMPONENT
===================== */

export function RescheduleTimeSlots({
  booking,
  selectedDate,
  selectedPlan,
  onSelectPlan,
}: Props) {
  const [plans, setPlans] = useState<AvailabilityChainPlan[]>([]);
  const [loading, setLoading] = useState(false);

  /* =====================
     FETCH SLOTS
  ===================== */

  useEffect(() => {
    if (!selectedDate) {
      setPlans([]);
      return;
    }

    async function load() {
      setLoading(true);

      try {
        const chain = booking.appointments.map((a) => ({
          serviceId: a.service.id,
          staffId: a.staff?.id ?? "ANY",
        }));

        const res = await getAvailabilityChain({
          slug: booking.branch.slug,
          body: {
            date: selectedDate,
            chain,
          },
        });

        setPlans(res);
      } catch (e) {
        console.error("Error loading availability chain", e);
        setPlans([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [selectedDate, booking]);

  /* =====================
     STATES
  ===================== */

  if (!selectedDate) {
    return (
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-muted-foreground"
      >
        Selecciona una fecha para ver horarios
      </motion.p>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-44 rounded-md bg-black/5" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[52px] rounded-xl border border-black/10 bg-white/70"
            />
          ))}
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-muted-foreground"
      >
        No hay horarios disponibles este día
      </motion.p>
    );
  }

  /* =====================
     RENDER
  ===================== */

  return (
    <div className="space-y-4">
      <motion.h3
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-semibold text-lg"
      >
        Horarios disponibles
      </motion.h3>

      <AnimatePresence mode="popLayout">
        <motion.div
          key={selectedDate}
          variants={container}
          initial="hidden"
          animate="show"
          exit="hidden"
          layout
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        >
          {plans.map((plan) => {
            const selected = selectedPlan?.startIso === plan.startIso;

            return (
              <motion.button
                key={plan.startIso}
                variants={item}
                layout
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectPlan?.(plan)}
                className={cn(
                  "relative rounded-xl border px-3 py-4 text-sm font-medium transition",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10",
                  selected
                    ? "bg-indigo-400 text-white border-indigo-400"
                    : "bg-white hover:bg-black/[0.02] border-black/10"
                )}
              >
                {selected && (
                  <motion.span
                    layoutId="slotGlow"
                    className="pointer-events-none absolute inset-0 rounded-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      boxShadow: "0 10px 30px rgba(99,102,241,0.22)",
                    }}
                  />
                )}

                <span className="relative z-10">
                  {plan.startLocalLabel ?? plan.startIso}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs text-muted-foreground"
      >
        Los horarios mostrados cubren la duración completa de tu cita
      </motion.p>
    </div>
  );
}