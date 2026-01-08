"use client";

import { cn } from "@/lib/utils";

export function Stepper({
  steps,
  current
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="flex items-center gap-6 mt-4 mb-2">
      {steps.map((s, i) => {
        const active = i === current;
        const completed = i < current;

        return (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full border flex items-center justify-center text-sm font-medium",
                active && "bg-primary text-white border-primary shadow-sm",
                completed && "bg-green-500 text-white border-green-500",
                !active && !completed && "bg-gray-50 text-gray-500"
              )}
            >
              {(i + 1).toString().padStart(2, "0")}
            </div>

            <span
              className={cn(
                "text-sm",
                active && "font-semibold",
                completed && "text-green-600"
              )}
            >
              {s}
            </span>
          </div>
        );
      })}
    </div>
  );
}