"use client";
import { motion } from "framer-motion";

type Props = {
  step: number;      // 1..3
  total?: number;    // default = 3
};

export function StepIndicator({ step, total = 3 }: Props) {

  return (
    <div className="w-full flex gap-2 mt-0">
      {Array.from({ length: total }).map((_, i) => {
        const active = i + 1 <= step;

        return (
          <div key={i} className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={false}
              animate={{
                width: active ? "100%" : "0%",
                backgroundColor: active ? "5C6BC0" : "#e5e7eb",
              }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="h-full rounded-full"
            />
          </div>
        );
      })}
    </div>
  );
}