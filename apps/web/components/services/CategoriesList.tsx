"use client";

import { useEffect, useState } from "react";
import { getServiceCategories } from "@/lib/services/service-categories";
import { CategoryIcon } from "../shared/Icon";

export type ServiceCategory = {
  id: string;
  name: string;
  icon?: string;
  colorHex?: string;
  organizationId: string;
  createdAt?: string;
};

function hexToRgba(hex: string, opacity: number) {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(sanitized, 16);

  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function CategoriesList() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getServiceCategories();
        setCategories(Array.isArray(data) ? data : []);
      } catch {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Cargando categorías...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-2 pb-20">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-6">
        {categories.map((c) => {
          const color = c.colorHex || "#E5E7EB";

          return (
            <div
              key={c.id}
              className="
            rounded-xl border bg-white
            p-4 flex flex-col gap-2
            cursor-pointer
            transition-all
            hover:shadow-sm hover:border-gray-300
          "
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: `${color}22`,
                }}
              >
                <CategoryIcon
                  name={c.icon ?? undefined}
                  className="w-5 h-5 text-black"
                />
              </div>

              <p className="text-sm font-medium text-gray-800">{c.name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
