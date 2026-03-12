"use client";

import { cn } from "@/lib/utils";

type Props = {
  value: "Servicios" | "Categorias";
  onChange: (v: "Servicios" | "Categorias") => void;
};

export function SegmentToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center border p-1 rounded-full bg-white">
      {[
        { key: "Servicios", label: "Servicios" },
        { key: "Categorias", label: "Categorias" },
      ].map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key as any)}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm transition-all",
            "focus:outline-none",
            value === item.key
              ? "bg-black shadow-sm font-medium text-white"
              : "text-black"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}