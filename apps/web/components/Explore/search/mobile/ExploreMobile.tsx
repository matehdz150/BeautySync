"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { PublicHeader } from "@/components/book/PublicHeader";
import ExploreMobileToolbar from "./ExploreMobileToolbar";
import FiltersModal from "../FiltersModal";
import ExploreListMobile from "./ExploreListMobile";

import { useExploreFilters } from "@/context/public/ExploreFiltersContext";
import { getExploreBranches } from "@/lib/services/public/explore";
import MobileFiltersSheet from "./MobileFiltersSheet";

const ExploreMap = dynamic(() => import("../ExploreMap"), { ssr: false });

export default function ExploreMobile({ initialBranches }: any) {
  const { filters } = useExploreFilters();

  const [branches, setBranches] = useState(initialBranches ?? []);
  const [loading, setLoading] = useState(false);

  const [sheetY, setSheetY] = useState(60);
  const [openFilters, setOpenFilters] = useState(false);

  const toolbarRef = useRef<HTMLDivElement>(null);
  const [topLimitPercent, setTopLimitPercent] = useState(12);

  // =============================
  // 🔥 FETCH (igual que desktop)
  // =============================
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

        setBranches(data ?? []);
      } catch (e) {
        console.error("Error fetching explore:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [filters]);

  // =============================
  // 🔥 TOOLBAR LIMIT
  // =============================
  useEffect(() => {
    function calculateLimit() {
      if (!toolbarRef.current) return;

      const rect = toolbarRef.current.getBoundingClientRect();

      const percent =
        (rect.bottom / window.innerHeight) * 100 + 14;

      setTopLimitPercent(percent);
    }

    calculateLimit();
    window.addEventListener("resize", calculateLimit);

    return () => window.removeEventListener("resize", calculateLimit);
  }, []);

  const isFull = sheetY <= topLimitPercent + 1;

  function handleDrag(event: any, info: any) {
    const delta = info.delta.y;

    setSheetY((prev) => {
      let next = prev + (delta / window.innerHeight) * 100;

      if (next < topLimitPercent) next = topLimitPercent;
      if (next > 85) next = 85;

      return next;
    });
  }

  function snap() {
    if (sheetY < topLimitPercent + 15) setSheetY(topLimitPercent);
    else if (sheetY < 60) setSheetY(45);
    else setSheetY(85);
  }

  return (
    <div
      className={`h-screen w-screen relative overflow-hidden transition-colors duration-300 ${
        isFull ? "bg-white" : ""
      }`}
    >
      <PublicHeader />

      {/* TOOLBAR */}
      <div ref={toolbarRef}>
        <ExploreMobileToolbar onOpenFilters={() => setOpenFilters(true)} />
      </div>

      {/* MAP */}
      {!isFull && (
        <div className="absolute inset-0">
          <ExploreMap branches={branches} />
        </div>
      )}

      {/* DRAWER */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        onDrag={handleDrag}
        onDragEnd={snap}
        animate={{ top: `${sheetY}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute left-0 right-0 h-[90vh] bg-white rounded-t-3xl shadow-2xl z-[1000] flex flex-col"
      >
        <div className="w-full flex justify-center py-3 cursor-grab">
          <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="overflow-y-auto flex-1">
          <ExploreListMobile branches={branches} loading={loading} />
        </div>
      </motion.div>

      {/* MODAL */}
      <MobileFiltersSheet
        open={openFilters}
        onClose={() => setOpenFilters(false)}
      />
    </div>
  );
}

