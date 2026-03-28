"use client";

import { useState, useEffect } from "react";
import ExploreList from "@/components/Explore/search/ExploreList";
import ExploreMap from "@/components/Explore/search/ExploreMapWrapper";
import { PublicHeader } from "@/components/book/PublicHeader";
import { Map } from "lucide-react";

import {
  ExploreFiltersProvider,
  useExploreFilters,
} from "@/context/public/ExploreFiltersContext";
import { getExploreBranches } from "@/lib/services/public/explore";
import { usePublicAuth } from "@/context/public/PublicAuthContext";

function ExploreContent({ initialBranches }: any) {
  const { filters } = useExploreFilters();
  const { user, loading: authLoading } = usePublicAuth();

  const [branches, setBranches] = useState(initialBranches);
  const [loading, setLoading] = useState(false);
  const [showMapFull, setShowMapFull] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // 🔥 FETCH CUANDO CAMBIAN FILTROS
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      try {
        const data = await getExploreBranches({
          ...filters,
          categories:
            filters.categories && filters.categories.length > 0
              ? filters.categories.join(",")
              : undefined,
        });
        console.log(data)

        setBranches(data);
      } catch (e) {
        console.error("Error fetching explore:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [filters]);

  return (
    <>
      <PublicHeader />

      {/* 🔥 GRID */}
      <div
        className={`grid transition-all duration-300 ${
          showMapFull ? "grid-cols-1" : "grid-cols-[60%_40%]"
        }`}
      >
        {/* LEFT */}
        {!showMapFull && (
          <div>
            <ExploreList branches={branches} loading={loading} onHover={setHoveredId}/>
          </div>
        )}

        {/* RIGHT (MAP) */}
        <div
          className={`sticky top-[72px] h-[calc(95vh-72px)] pr-3 ${
            showMapFull ? "col-span-1" : ""
          }`}
        >
          <ExploreMap branches={branches} isFullMap={showMapFull} hoveredId={hoveredId} />
        </div>
      </div>

      {/* 🔥 FLOAT BUTTON */}
      <button
        onClick={() => setShowMapFull((prev) => !prev)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 bg-black text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition"
      >
        <Map className="w-4 h-4" />
        {showMapFull ? "Ver lista" : "Ver mapa"}
      </button>
    </>
  );
}

export default function PageWrapper({ branches }: any) {
  return (
    <ExploreFiltersProvider>
      <ExploreContent initialBranches={branches} />
    </ExploreFiltersProvider>
  );
}
