"use client";

import { cn } from "@/lib/utils";
import { useAvailability } from "@/context/AvailabilityContext";
import { usePublicBooking } from "@/context/PublicBookingContext";
import { motion, AnimatePresence } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
};

const item = {
  hidden: { opacity: 0, y: 6, scale: 0.99 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.16 } },
  exit: { opacity: 0, y: 4, transition: { duration: 0.12 } },
};

export function TimeSlotsMobile() {
  const availability = useAvailability();
  const booking = usePublicBooking();

  const plans = availability.plans;

  if (!booking.date) {
    return (
      <p className="text-sm text-muted-foreground">
        Selecciona una fecha para ver horarios
      </p>
    );
  }

  if (availability.loading) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-44 rounded-md bg-black/5" />

        <div className="grid grid-cols-1 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[56px] rounded-2xl border border-black/10 bg-white/70"
            />
          ))}
        </div>

        <div className="h-4 w-72 rounded-md bg-black/5" />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay horarios disponibles este día
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base">Horarios disponibles</h3>

      <AnimatePresence mode="popLayout">
        <motion.div
          key={booking.date}
          variants={container}
          initial="hidden"
          animate="show"
          exit="hidden"
          layout
          className="grid grid-cols-1 gap-3"
        >
          {plans.map((plan) => {
            const selected = booking.time === plan.startIso;

            return (
              <motion.button
                key={plan.startIso}
                variants={item}
                layout
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
                  "relative w-full rounded-2xl border px-3 py-4 text-base font-normal transition text-left",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10",
                  selected
                    ? "bg-indigo-500 text-white border-indigo-500"
                    : "bg-white border-black/10 active:bg-black/[0.03]"
                )}
              >
                {selected && (
                  <span
                    className="pointer-events-none absolute inset-0 rounded-2xl"
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

      <p className="text-xs text-muted-foreground">
        Los horarios cubren la duración completa de tu cita.
      </p>
    </div>
  );
}