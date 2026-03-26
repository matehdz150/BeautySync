"use client";

import { useState } from "react";
import { getExploreBranches } from "@/lib/services/public/explore";
import ExploreList from "@/components/Explore/search/ExploreList";
import ExploreMap from "@/components/Explore/search/ExploreMapWrapper";
import { PublicHeader } from "@/components/book/PublicHeader";
import { Map } from "lucide-react";

export default function PageWrapper({ branches }: any) {
  const [showMapFull, setShowMapFull] = useState(false);

  return (
    <>
      <PublicHeader />

      <div
        className={`grid transition-all duration-300 ${
          showMapFull ? "grid-cols-1" : "grid-cols-[60%_40%]"
        }`}
      >
        {/* LEFT */}
        {!showMapFull && (
          <div>
            <ExploreList branches={branches} />
          </div>
        )}

        {/* RIGHT (MAP) */}
        <div
          className={`sticky top-[72px] h-[calc(95vh-72px)] pr-3 ${
            showMapFull ? "col-span-1" : ""
          }`}
        >
          <ExploreMap branches={branches} isFullMap={showMapFull} />
        </div>
      </div>

      {/* 🔥 FLOAT BUTTON */}
      <button
        onClick={() => setShowMapFull((prev) => !prev)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition"
      >
        <Map className="w-4 h-4" />
        {showMapFull ? "Ver lista" : "Ver mapa"}
      </button>
    </>
  );
}