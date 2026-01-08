"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function StepperBadge({
  steps,
  step,
}: {
  steps: string[];
  step: number;
}) {
  return (
    <div className="flex justify-between mt-6">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n <= step;

        return (
          <motion.div
            key={label}
            className="flex-1 flex flex-col items-center relative"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.05 }}
          >
            <motion.div
              animate={{
                backgroundColor: active ? "#000" : "#f3f3f3",
                color: active ? "#fff" : "black",
                scale: active ? 1.05 : 1,
              }}
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold z-10"
              )}
            >
              {active && n < step ? <Check className="h-4 w-4" /> : n}
            </motion.div>

            <span className="text-sm mt-2">{label}</span>

            {n < steps.length && (
              <motion.div
                animate={{
                  backgroundColor: step > n ? "#000" : "#E5E7EB",
                }}
                className="absolute top-[18px] right-[-50%] h-[2px] w-[100%]"
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}