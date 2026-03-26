"use client";

import { useState, useMemo, useEffect } from "react";
import { Scissors, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { getServiceCategories } from "@/lib/services/public/services";
import { CategoryIcon } from "@/components/shared/Icon";
import { useExploreFilters } from "@/context/public/ExploreFiltersContext";

type Category = {
  id: string;
  name: string;
  icon: string;
};

export default function ServicesFilter() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const { filters, setFilters } = useExploreFilters();
  const value = filters.categories ?? [];

  useEffect(() => {
    getServiceCategories()
      .then((data) => setCategories(data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  const filtered = useMemo(() => {
    return categories.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [categories, search]);

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
    <div className="relative">
      {/* 🔥 BACKDROP */}
      <AnimatePresence>
        {open && (
          <motion.div
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/10 z-40"
          />
        )}
      </AnimatePresence>

      {/* BUTTON */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 border rounded-full px-4 py-2 text-sm transition relative z-50
          ${open ? "shadow-lg bg-white" : "hover:bg-gray-50"}
        `}
      >
        <Scissors className="w-4 h-4" />
        Servicios
        {value.length > 0 && (
          <span className="ml-1 text-xs bg-black text-white px-2 py-0.5 rounded-full">
            {value.length}
          </span>
        )}
      </button>

      {/* 🔥 DROPDOWN */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scaleY: 0.9 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
            transition={{
              duration: 0.18,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{ originY: 0 }} // 🔥 crece desde arriba
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-142 bg-white border rounded-2xl shadow-xl p-3 z-50"
          >
            {/* SEARCH */}
            <input
              type="text"
              placeholder="Buscar servicio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full mb-3 px-3 py-3 text-sm rounded-lg outline-none focus:ring-2 focus:ring-black/10 bg-gray-100"
            />

            {/* LOADING */}
            {loading && (
              <div className="text-sm text-gray-400 px-2 py-4">Cargando...</div>
            )}

            {/* 🔥 BADGES */}
            {value.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {value.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className="flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-black text-white hover:opacity-80 transition"
                  >
                    {cat}

                    {/* X */}
                    <span className="ml-1 text-white/80 hover:text-white">
                      ✕
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* LIST */}
            {!loading && (
              <div className="max-h-80 overflow-y-auto grid grid-cols-2 gap-2">
                {filtered.map((c) => {
                  const selected = value.includes(c.name);

                  return (
                    <motion.button
                      key={c.id}
                      onClick={() => toggleCategory(c.name)}
                      whileTap={{ scale: 0.97 }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition
                        ${
                          selected ? "bg-black text-white" : "hover:bg-gray-100"
                        }
                      `}
                    >
                      <div
                        className={`w-10 h-10 flex items-center justify-center rounded-full border transition shrink-0
                          ${selected ? "border-white" : "border-gray-200"}
                        `}
                      >
                        <CategoryIcon
                          name={c.icon}
                          className={`w-4 h-4 ${
                            selected ? "text-white" : "text-indigo-500"
                          }`}
                        />
                      </div>

                      <span className="truncate flex-1 text-left">
                        {c.name}
                      </span>

                      {selected && <Check className="w-4 h-4 shrink-0" />}
                    </motion.button>
                  );
                })}

                {filtered.length === 0 && (
                  <div className="col-span-2 text-sm text-gray-400 px-2 py-2">
                    Sin resultados
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
