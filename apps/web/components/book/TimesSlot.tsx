"use client";

import { cn } from "@/lib/utils";
import { useAvailability } from "@/context/AvailabilityContext";
import { usePublicBooking } from "@/context/PublicBookingContext";
import { motion, AnimatePresence } from "framer-motion";

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

export function TimeSlots() {
  const availability = useAvailability();
  const booking = usePublicBooking();

  const plans = availability.plans;

  if (!booking.date) {
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

  if (availability.loading) {
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
        <div className="h-4 w-72 rounded-md bg-black/5" />
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
          key={booking.date} // cuando cambia la fecha, re-animamos la grilla
          variants={container}
          initial="hidden"
          animate="show"
          exit="hidden"
          layout
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        >
          {plans.map((plan) => {
            const selected = booking.time === plan.startIso;

            return (
              <motion.button
                key={plan.startIso}
                variants={item}
                layout
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  booking.dispatch({ type: "SET_TIME", payload: plan.startIso });
                  booking.dispatch({
                    type: "SET_SELECTED_PLAN",
                    payload: plan,
                  });

                  booking.dispatch({
                    type: "SET_APPOINTMENTS_DRAFT",
                    payload: plan.assignments.map((a) => ({
                      serviceId: a.serviceId,
                      staffId: a.staffId,
                      startIso: a.startLocalIso,
                      endIso: a.endLocalIso,
                      durationMin: a.durationMin,
                    })),
                  });
                }}
                className={cn(
                  "relative rounded-xl border px-3 py-4 text-sm font-medium transition",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10",
                  selected
                    ? "bg-indigo-400 text-white border-indigo-400"
                    : "bg-white hover:bg-black/[0.02] border-black/10"
                )}
              >
                {/* Selected glow (muy sutil) */}
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