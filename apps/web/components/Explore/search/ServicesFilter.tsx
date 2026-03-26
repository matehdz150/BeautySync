"use client";

import { useState, useMemo, useEffect } from "react";
import { Scissors, Check } from "lucide-react";
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

  // 🔥 CONTEXTO
  const { filters, setFilters } = useExploreFilters();
  const value = filters.categories ?? [];

  // 🔥 fetch categories
  useEffect(() => {
    getServiceCategories()
      .then((data) => setCategories(data))
      .finally(() => setLoading(false));
  }, []);

  // 🔒 bloquear scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  // 🔍 filter local
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

    // 🔥 ACTUALIZA URL (esto dispara SSR)
    setFilters({ categories: next });
  }

  return (
    <div className="relative">
      {/* 🔥 BACKDROP */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/10 z-40"
        />
      )}

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

      {/* DROPDOWN */}
      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-142 bg-white border rounded-2xl shadow-xl p-3 z-50">
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
            <div className="text-sm text-gray-400 px-2 py-4">
              Cargando...
            </div>
          )}

          {/* LIST */}
          {!loading && (
            <div className="max-h-80 overflow-y-auto grid grid-cols-2 gap-2">
              {filtered.map((c) => {
                const selected = value.includes(c.name);

                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCategory(c.name)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition
                      ${
                        selected
                          ? "bg-black text-white"
                          : "hover:bg-gray-100"
                      }
                    `}
                  >
                    {/* ICON */}
                    <div
                      className={`w-10 h-10 flex items-center justify-center rounded-full border transition shrink-0
                        ${
                          selected
                            ? "border-white"
                            : "border-gray-200"
                        }
                      `}
                    >
                      <CategoryIcon
                        name={c.icon}
                        className={`w-4 h-4 ${
                          selected
                            ? "text-white"
                            : "text-indigo-500"
                        }`}
                      />
                    </div>

                    {/* NAME */}
                    <span className="truncate flex-1 text-left">
                      {c.name}
                    </span>

                    {/* CHECK */}
                    {selected && (
                      <Check className="w-4 h-4 shrink-0" />
                    )}
                  </button>
                );
              })}

              {/* EMPTY */}
              {filtered.length === 0 && (
                <div className="col-span-2 text-sm text-gray-400 px-2 py-2">
                  Sin resultados
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}