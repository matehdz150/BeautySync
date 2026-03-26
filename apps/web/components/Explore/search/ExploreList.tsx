"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { ExploreToolbar } from "./ExploreToolbar";
import { motion } from "framer-motion";

// 🔥 IMPORTS IMPORTANTES
import ExploreListSkeleton from "./ListSkeleton";
import ExploreEmptyState from "./ExploreEmptystate";

export default function ExploreList({ branches, loading, onHover }: any) {
  const router = useRouter();

  return (
    <div>
      <ExploreToolbar total={branches.length} onOpenFilters={() => {}} />

      {/* ========================= */}
      {/* 🔥 LOADING */}
      {/* ========================= */}
      {loading && <ExploreListSkeleton />}

      {/* ========================= */}
      {/* 🔥 EMPTY */}
      {/* ========================= */}
      {!loading && branches.length === 0 && <ExploreEmptyState />}

      {/* ========================= */}
      {/* 🔥 DATA */}
      {/* ========================= */}
      {!loading && branches.length > 0 && (
        <motion.div
          key={branches.map((b: any) => b.id).join("-")}
          className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-0"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
        >
          {branches.map((b: any) => (
            <motion.div
              key={b.id}
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0 },
              }}
              onMouseEnter={() => onHover?.(b.id)}
              onMouseLeave={() => onHover?.(null)}
              transition={{ duration: 0.2 }}
              onClick={() => router.push(`/book/${b.publicSlug}`)}
              className="group cursor-pointer rounded-2xl overflow-hidden bg-white border border-black/5 hover:shadow-xl transition-all duration-300"
            >
              {/* IMAGE */}
              <div className="relative w-full h-48 overflow-hidden">
                {b.coverImage ? (
                  <img
                    src={b.coverImage}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-sm text-gray-400">
                    Sin imagen
                  </div>
                )}

                <div className="absolute top-3 left-3 flex items-center gap-1 bg-black text-white text-xs px-3 py-1 rounded-full shadow">
                  <Star className="w-3.5 h-3.5 fill-white" />
                  <span className="font-medium">{b.ratingAvg.toFixed(1)}</span>
                </div>
              </div>

              {/* INFO */}
              <div className="p-4 space-y-2">
                <h2 className="font-semibold text-base line-clamp-1">
                  {b.name}
                </h2>

                <p className="text-sm text-gray-500 line-clamp-1">
                  {b.address || "Sin dirección"}
                </p>

                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {b.ratingCount} reseñas
                  </span>
                  <span className="text-indigo-500">
                    {b.servicesCount} servicios
                  </span>
                </div>

                <div className="mt-3 space-y-1">
                  {b.servicesPreview.slice(0, 3).map((s: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between text-xs text-gray-600"
                    >
                      <span className="truncate">{s.name}</span>
                      <span>{s.durationMin} min</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
