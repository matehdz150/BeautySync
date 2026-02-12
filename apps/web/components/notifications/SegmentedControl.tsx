"use client";

import { motion } from "framer-motion";

interface Props {
  value: "ALL" | "UNREAD";
  onChange: (v: "ALL" | "UNREAD") => void;
}

export function SegmentedControl({ value, onChange }: Props) {
  return (
    <div className="relative inline-flex rounded-full border p-1">

      {(["ALL", "UNREAD"] as const).map((option) => {
        const isActive = value === option;

        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            className="relative flex-1 px-6 py-1.5 text-base font-semibold rounded-full text-center transition-colors"
          >
            {/* Animated Background */}
            {isActive && (
              <motion.div
                layoutId="segmented-bg"
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
                className="absolute inset-0 rounded-full bg-background border"
              />
            )}

            {/* Label */}
            <span
              className={`relative z-10 ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option === "ALL" ? "All" : "Unread"}
            </span>
          </button>
        );
      })}
    </div>
  );
}