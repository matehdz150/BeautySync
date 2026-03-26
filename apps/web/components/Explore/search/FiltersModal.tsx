"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MapPin, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useExploreFilters } from "@/context/public/ExploreFiltersContext";

export default function FiltersModal({ open, onClose }: any) {
  const { filters, setFilters } = useExploreFilters();

  // 🔥 LOCAL STATE
  const [local, setLocal] = useState(filters);

  // 🔥 sync cuando abre
  useEffect(() => {
    if (open) {
      setLocal({
        ...filters,
        maxPrice: filters.maxPrice
          ? Math.round(filters.maxPrice / 100)
          : undefined,
        minPrice: filters.minPrice
          ? Math.round(filters.minPrice / 100)
          : undefined,
      });
    }
  }, [open, filters]);

  function apply() {
    setFilters({
      ...local,
      maxPrice: local.maxPrice ? local.maxPrice * 100 : undefined, // 🔥 pesos → centavos
      minPrice: local.minPrice ? local.minPrice * 100 : undefined,
    });

    onClose();
  }

  function reset() {
    const empty = {};
    setLocal(empty);
    setFilters(empty);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* BACKDROP */}
          <motion.div
            className="fixed inset-0 bg-black/30 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* MODAL WRAPPER */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* MODAL */}
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-3xl bg-white rounded-3xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              {/* HEADER */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Filtros</h2>
                <button onClick={onClose}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ===================== */}
              {/* SORT */}
              {/* ===================== */}
              <h3 className="text-sm font-medium mb-3">Filtrar por</h3>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  {
                    label: "Mejor coincidencia",
                    value: undefined,
                    icon: Heart,
                  },
                  {
                    label: "Más cercanos",
                    value: "distance",
                    icon: MapPin,
                  },
                  {
                    label: "Mejor valorados",
                    value: "rating",
                    icon: Star,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = local.sort === item.value;

                  return (
                    <button
                      key={item.label}
                      onClick={() => setLocal({ ...local, sort: item.value })}
                      className={`p-4 rounded-xl border text-sm flex flex-col items-center gap-2 transition
                        ${
                          active
                            ? "border-indigo-500 bg-indigo-50"
                            : "hover:bg-gray-50"
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* ===================== */}
              {/* PRICE */}
              {/* ===================== */}
              <h3 className="text-sm font-medium mb-2">Precio máximo</h3>

              <input
                type="range"
                min={0}
                max={10000}
                value={local.maxPrice ?? 10000}
                onChange={(e) =>
                  setLocal({
                    ...local,
                    maxPrice: Number(e.target.value),
                  })
                }
                className="w-full mb-6"
              />

              <div className="text-right text-sm text-gray-500 mb-6">
                MX${(local.maxPrice ?? 10000).toLocaleString()}+
              </div>

              {/* ===================== */}
              {/* RATING */}
              {/* ===================== */}
              <h3 className="text-sm font-medium mb-3">Rating mínimo</h3>

              <div className="flex gap-2 mb-6">
                {[0, 2, 3, 4, 5].map((r) => {
                  const active = local.rating === r;

                  return (
                    <button
                      key={r}
                      onClick={() => setLocal({ ...local, rating: r })}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm border transition
    ${active ? "bg-black text-white" : "hover:bg-gray-100"}
  `}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          active ? "fill-white text-white" : "text-amber-500 fill-amber-500"
                        }`}
                      />
                      {r}+
                    </button>
                  );
                })}
              </div>

              {/* ===================== */}
              {/* FOOTER */}
              {/* ===================== */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={reset}
                  className="flex-1 border rounded-full py-3 text-sm hover:bg-gray-50 transition"
                >
                  Eliminar todos
                </button>

                <button
                  onClick={apply}
                  className="flex-1 bg-black text-white rounded-full py-3 text-sm hover:opacity-90 transition"
                >
                  Aplicar
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
