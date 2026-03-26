// components/Explore/filters/FiltersButton.tsx

"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import FiltersModal from "./FiltersModal";

export default function FiltersButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border rounded-full px-4 py-2 text-sm hover:bg-gray-50 transition"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filtros
      </button>

      <FiltersModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}