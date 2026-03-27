"use client";

import { Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import SearchDropdown from "./SearchDrpdown";
import { SearchType, useSearch } from "@/hooks/use-search";

export default function GlobalSearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<SearchType>("all");

  const containerRef = useRef<HTMLDivElement>(null);

  const { results, loading, loadingMore, loadMore } = useSearch(
    query,
    open,
    type,
  );

  // 🔥 cerrar al click afuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-xl z-50">
      {/* INPUT */}
      <div className="relative z-50 flex items-center gap-3 rounded-full px-4 py-3 bg-gray-100 focus-within:shadow-md transition-all duration-200">
        <Search className="w-4 h-4 text-gray-500" />

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Buscar servicios, lugares o personal"
          className="w-full bg-transparent outline-none text-sm placeholder:text-gray-400"
        />
      </div>

      {/* 🔥 DROPDOWN */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setOpen(false)}
          />
          <SearchDropdown
            results={results}
            loading={loading}
            loadingMore={loadingMore}
            loadMore={loadMore}
            type={type}
            setType={setType}
          />
        </>
      )}
    </div>
  );
}
