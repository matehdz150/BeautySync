"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Branch = {
  id: string;
  name: string;
  address?: string;
  coverImage?: string;
};

export type Service = {
  id: string;
  name: string;
  durationMin: number;
  icon?: string;
};

export type Staff = {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
};

export type CursorResponse<T> = {
  items: T[];
  nextCursor: string | null;
};

export type SearchResults = {
  branches: CursorResponse<Branch>;
  services: CursorResponse<Service>;
  staff: CursorResponse<Staff>;
};

export type SearchType = "all" | "branches" | "services" | "staff";

function emptyResults(): SearchResults {
  return {
    branches: { items: [], nextCursor: null },
    services: { items: [], nextCursor: null },
    staff: { items: [], nextCursor: null },
  };
}

function normalize(data: unknown): SearchResults {
  const safe = (data ?? {}) as Partial<SearchResults>;

  return {
    branches: safe.branches ?? { items: [], nextCursor: null },
    services: safe.services ?? { items: [], nextCursor: null },
    staff: safe.staff ?? { items: [], nextCursor: null },
  };
}

export function useSearch(query: string, open: boolean, type: SearchType) {
  const [results, setResults] = useState<SearchResults>(emptyResults());
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  

  const cursorsRef = useRef<{
    branches: string | null;
    services: string | null;
    staff: string | null;
  }>({
    branches: null,
    services: null,
    staff: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;

    setResults(emptyResults());
    cursorsRef.current = {
      branches: null,
      services: null,
      staff: null,
    };
  }, [query, type, open]);

  const fetchData = useCallback(
    async (isLoadMore = false) => {
        
      if (type === "all" && isLoadMore) return;

      if (isLoadMore) {
        if (loadingMore) return;
      } else {
        if (loading) return;
      }

      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        abortRef.current?.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const params = new URLSearchParams();

        if (query.trim()) params.append("query", query);
        if (type !== "all") params.append("type", type);

        if (type !== "all") {
          const cursor = cursorsRef.current[type];
          if (cursor) params.append("cursor", cursor);
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/search/global?${params.toString()}`,
          { signal: controller.signal },
        );

        const raw = await res.json();
        const data = normalize(raw);

        setResults((prev) => ({
          branches: {
            items:
              isLoadMore && type === "branches"
                ? [...prev.branches.items, ...data.branches.items]
                : type === "branches" || type === "all"
                  ? data.branches.items
                  : prev.branches.items,
            nextCursor: data.branches.nextCursor,
          },
          services: {
            items:
              isLoadMore && type === "services"
                ? [...prev.services.items, ...data.services.items]
                : type === "services" || type === "all"
                  ? data.services.items
                  : prev.services.items,
            nextCursor: data.services.nextCursor,
          },
          staff: {
            items:
              isLoadMore && type === "staff"
                ? [...prev.staff.items, ...data.staff.items]
                : type === "staff" || type === "all"
                  ? data.staff.items
                  : prev.staff.items,
            nextCursor: data.staff.nextCursor,
          },
        }));

        if (type !== "all") {
          cursorsRef.current[type] = data[type].nextCursor ?? null;
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [query, type], // ✅ SOLO estos
  );

  useEffect(() => {
    if (!open) return;

    fetchData(false);
  }, [query, type, open]); // ❌ NO fetchData aquí

  const loadMore = useCallback(() => {
    if (type === "all") return;

    const cursor = cursorsRef.current[type];
    if (!cursor) return;

    void fetchData(true);
  }, [type, fetchData]);

  return {
    results,
    loading,
    loadingMore,
    loadMore,
  };
}
