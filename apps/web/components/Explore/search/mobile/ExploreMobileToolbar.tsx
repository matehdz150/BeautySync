"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import ExploreMobileCategories from "./ExploreMobileCategories";

export default function ExploreMobileToolbar({
  onOpenFilters,
}: {
  onOpenFilters?: () => void;
}) {
  const [search, setSearch] = useState("");

  return (
    <div className="absolute top-20 left-0 right-0 z-[2000] px-4">
      {/* 🔥 COLUMN WRAPPER */}
      <div className="flex flex-col gap-0">
        {/* 🔍 ROW 1 → SEARCH + FILTER */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white/90 backdrop-blur-xl border border-black/10 rounded-full px-4 py-3 shadow-lg">
            <Search className="w-4 h-4 text-gray-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar servicios..."
              className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
            />
          </div>

          <button
            onClick={onOpenFilters}
            className="bg-white/90 backdrop-blur-xl border border-black/10 rounded-full p-3 shadow-lg active:scale-95 transition"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* 🔥 ROW 2 → CATEGORIES */}
        <ExploreMobileCategories />
      </div>
    </div>
  );
}
