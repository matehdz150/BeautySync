"use client";

import { motion } from "framer-motion";
import { usePublicBooking } from "@/context/PublicBookingContext";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";

const TOTAL_STEPS = 4;

export function BookingStepIndicator() {
  const { step } = usePublicBooking();

  return (
    <div className="w-full px-6 pt-4">
      <div className="flex gap-2 items-center">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
          const active = i + 1 <= step;

          return (
            <div
              key={i}
              className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden"
            >
              <motion.div
                initial={false}
                animate={{
                  width: active ? "100%" : "0%",
                }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="h-full rounded-full bg-indigo-400"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}