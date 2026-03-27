"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getServiceCategories } from "@/lib/services/public/services";
import { useExploreFilters } from "@/context/public/ExploreFiltersContext";

type Category = {
  id: string;
  name: string;
  icon: string;
};

export default function ExploreMobileCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const { filters, setFilters } = useExploreFilters();

  const value = filters.categories ?? [];

  useEffect(() => {
    getServiceCategories().then(setCategories);
  }, []);

  function toggleCategory(name: string) {
    let next: string[];

    if (value.includes(name)) {
      next = value.filter((v) => v !== name);
    } else {
      next = [...value, name];
    }

    setFilters({ categories: next });
  }

  return (
    <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar px-1">
      {categories.map((c) => {
        const selected = value.includes(c.name);

        return (
          <motion.button
            key={c.id}
            onClick={() => toggleCategory(c.name)}
            whileTap={{ scale: 0.95 }}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm border transition
              ${
                selected
                  ? "bg-black text-white border-black"
                  : "bg-white/90 backdrop-blur border-black/10"
              }
            `}
          >
            {c.name}
          </motion.button>
        );
      })}
    </div>
  );
}