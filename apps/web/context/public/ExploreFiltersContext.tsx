"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Filters = {
  lat?: number;
  lng?: number;
  radius?: number;

  categories?: string[];
  minPrice?: number;
  maxPrice?: number;

  rating?: number;
  sort?: "distance" | "rating" | "price";
};

type ContextType = {
  filters: Filters;
  setFilters: (next: Partial<Filters>) => void;
  clearFilters: () => void;
};

const ExploreFiltersContext = createContext<ContextType | null>(null);

export function ExploreFiltersProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 🔥 parse URL → state
  const filters: Filters = useMemo(() => {
    return {
      lat: searchParams.get("lat")
        ? Number(searchParams.get("lat"))
        : undefined,

      lng: searchParams.get("lng")
        ? Number(searchParams.get("lng"))
        : undefined,

      radius: searchParams.get("radius")
        ? Number(searchParams.get("radius"))
        : undefined,

      categories: searchParams.get("categories")
        ? searchParams.get("categories")!.split(",")
        : [],

      minPrice: searchParams.get("minPrice")
        ? Number(searchParams.get("minPrice"))
        : undefined,

      maxPrice: searchParams.get("maxPrice")
        ? Number(searchParams.get("maxPrice"))
        : undefined,

      rating: searchParams.get("rating")
        ? Number(searchParams.get("rating"))
        : undefined,

      sort: (searchParams.get("sort") as Filters["sort"]) ?? undefined,
    };
  }, [searchParams]);

  // 🔥 update URL
  function setFilters(next: Partial<Filters>) {
    const params = new URLSearchParams(searchParams.toString());

    const merged = { ...filters, ...next };

    // categories
    if (merged.categories && merged.categories.length > 0) {
      params.set("categories", merged.categories.join(","));
    } else {
      params.delete("categories");
    }

    // numeric
    const numericKeys: (keyof Filters)[] = [
      "lat",
      "lng",
      "radius",
      "minPrice",
      "maxPrice",
      "rating",
    ];

    numericKeys.forEach((key) => {
      const value = merged[key];

      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });

    // sort
    if (merged.sort) {
      params.set("sort", merged.sort);
    } else {
      params.delete("sort");
    }

    const query = params.toString();

    router.replace(`?${query}`, { scroll: false });
    router.refresh(); // 🔥 AHORA SÍ
  }

  function clearFilters() {
    router.push("?");
  }

  return (
    <ExploreFiltersContext.Provider
      value={{ filters, setFilters, clearFilters }}
    >
      {children}
    </ExploreFiltersContext.Provider>
  );
}

export function useExploreFilters() {
  const ctx = useContext(ExploreFiltersContext);
  if (!ctx) throw new Error("useExploreFilters must be used inside provider");
  return ctx;
}
