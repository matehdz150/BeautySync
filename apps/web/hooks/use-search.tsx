"use client";

import { useEffect, useRef, useState } from "react";

/* ========================= */
/* TYPES */
/* ========================= */

export type Branch = {
  id: string;
  name: string;
  address?: string;
};

export type Service = {
  id: string;
  name: string;
  durationMin: number;
};

export type Staff = {
  id: string;
  name: string;
  role?: string;
};

export type SearchResults = {
  branches: Branch[];
  services: Service[];
  staff: Staff[];
};

export type SearchType = "all" | "branches" | "services" | "staff";

/* ========================= */
/* HOOK */
/* ========================= */

export function useSearch(query: string, open: boolean, type: SearchType) {
  const [results, setResults] = useState<SearchResults>({
    branches: [],
    services: [],
    staff: [],
  });

  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // 🔥 cache en memoria
  const cacheRef = useRef<Map<string, SearchResults>>(new Map());

  /* ========================= */
  /* DEBOUNCE */
  /* ========================= */

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  /* ========================= */
  /* FETCH */
  /* ========================= */

  useEffect(() => {
    if (!open) return;

    if (debouncedQuery && debouncedQuery.length < 2) return;

    const safeType = type ?? "all";

    const key = `${safeType}:${debouncedQuery || "empty"}`;

    // 🔥 CACHE HIT → instant UX
    const cached = cacheRef.current.get(key);
    if (cached) {
      setResults(cached);
    }

    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams();

        if (debouncedQuery?.trim()) {
          params.append("query", debouncedQuery);
        }

        if (safeType !== "all") {
          params.append("type", safeType);
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/search/global?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          const text = await res.text();
          console.error("❌ API ERROR:", res.status, text);
          throw new Error("Search failed");
        }

        const data: SearchResults = await res.json();

        // 🔥 guardar en cache
        cacheRef.current.set(key, data);

        setResults(data);
      } catch (e: any) {
        if (e.name !== "AbortError") {
          console.error("Search error:", e);
        }
      } finally {
        setLoading(false);
        setHasFetched(true); // 🔥 clave para evitar flicker
      }
    };

    fetchData();

    return () => controller.abort();
  }, [debouncedQuery, open, type]);

  return { results, loading, hasFetched };
}