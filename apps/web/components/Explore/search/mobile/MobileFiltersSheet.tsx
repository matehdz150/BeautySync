"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MapPin, Star, Check } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

import { useExploreFilters } from "@/context/public/ExploreFiltersContext";
import { getServiceCategories } from "@/lib/services/public/services";
import { CategoryIcon } from "@/components/shared/Icon";

type Category = {
  id: string;
  name: string;
  icon: string;
};

export default function MobileFiltersSheet({ open, onClose }: any) {
  const { filters, setFilters } = useExploreFilters();

  const [local, setLocal] = useState<any>(filters);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // =============================
  // 🔥 SYNC + CENTAVOS
  // =============================
  useEffect(() => {
    if (open) {
      setLocal({
        ...filters,
        maxPrice: filters.maxPrice
          ? Math.round(filters.maxPrice / 100)
          : undefined,
      });
    }
  }, [open, filters]);

  // =============================
  // 🔥 FETCH CATEGORIES
  // =============================
  useEffect(() => {
    getServiceCategories()
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  const selectedCategories = local.categories ?? [];

  function toggleCategory(name: string) {
    let next: string[];

    if (selectedCategories.includes(name)) {
      next = selectedCategories.filter((v: string) => v !== name);
    } else {
      next = [...selectedCategories, name];
    }

    setLocal({ ...local, categories: next });
  }

  function apply() {
    setFilters({
      ...local,
      maxPrice: local.maxPrice ? local.maxPrice * 100 : undefined,
    });

    onClose();
  }

  function reset() {
    setLocal({});
    setFilters({});
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* BACKDROP */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-[3000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* SHEET */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 z-[3001] bg-white rounded-t-3xl h-[90vh] flex flex-col"
          >
            {/* HANDLE */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* HEADER */}
            <div className="flex justify-between items-center px-5 mb-4">
              <h2 className="text-lg font-semibold">Filtros</h2>
              <button onClick={onClose}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto px-5 space-y-6">

              {/* ===================== */}
              {/* SORT */}
              {/* ===================== */}
              <div>
                <h3 className="text-sm font-medium mb-3">Ordenar por</h3>

                <div className="flex gap-2">
                  {[
                    { label: "Top", value: undefined, icon: Heart },
                    { label: "Cercanos", value: "distance", icon: MapPin },
                    { label: "Rating", value: "rating", icon: Star },
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = local.sort === item.value;

                    return (
                      <button
                        key={item.label}
                        onClick={() =>
                          setLocal({ ...local, sort: item.value })
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm border
                          ${
                            active
                              ? "bg-black text-white"
                              : "hover:bg-gray-100"
                          }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ===================== */}
              {/* CATEGORIES */}
              {/* ===================== */}
              <div>
                <h3 className="text-sm font-medium mb-3">Servicios</h3>

                {loading && <p className="text-sm text-gray-400">Cargando...</p>}

                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => {
                    const active = selectedCategories.includes(c.name);

                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleCategory(c.name)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm border transition
                          ${
                            active
                              ? "bg-black text-white"
                              : "bg-gray-100"
                          }`}
                      >
                        <CategoryIcon
                          name={c.icon}
                          className="w-4 h-4"
                        />
                        {c.name}
                        {active && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ===================== */}
              {/* PRICE */}
              {/* ===================== */}
              <div>
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
                  className="w-full"
                />

                <div className="text-right text-sm text-gray-500 mt-1">
                  MX${(local.maxPrice ?? 10000).toLocaleString()}+
                </div>
              </div>

              {/* ===================== */}
              {/* RATING */}
              {/* ===================== */}
              <div>
                <h3 className="text-sm font-medium mb-3">Rating mínimo</h3>

                <div className="flex gap-2">
                  {[0, 2, 3, 4, 5].map((r) => {
                    const active = local.rating === r;

                    return (
                      <button
                        key={r}
                        onClick={() =>
                          setLocal({ ...local, rating: r })
                        }
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm border
                          ${
                            active
                              ? "bg-black text-white"
                              : "hover:bg-gray-100"
                          }`}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            active
                              ? "fill-white text-white"
                              : "text-amber-500 fill-amber-500"
                          }`}
                        />
                        {r}+
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="p-4 border-t flex gap-3">
              <button
                onClick={reset}
                className="flex-1 border rounded-full py-3 text-sm"
              >
                Limpiar
              </button>

              <button
                onClick={apply}
                className="flex-1 bg-black text-white rounded-full py-3 text-sm"
              >
                Aplicar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}