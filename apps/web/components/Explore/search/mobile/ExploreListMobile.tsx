"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import ExploreListSkeleton from "../ListSkeleton";
import ExploreEmptyState from "../ExploreEmptystate";

export default function ExploreListMobile({ branches = [], loading }: any) {
  const router = useRouter();

  return (
    <div className="px-4 pb-10">
      
      {/* 🔥 LOADING */}
      {loading && <ExploreListSkeleton />}

      {/* 🔥 EMPTY */}
      {!loading && branches.length === 0 && <ExploreEmptyState />}

      {/* 🔥 LIST */}
      {!loading && branches.length > 0 && (
        <motion.div
          className="flex flex-col gap-4"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: { staggerChildren: 0.05 },
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
              transition={{ duration: 0.2 }}
              onClick={() => router.push(`/book/${b.publicSlug}`)}
              className="rounded-2xl overflow-hidden bg-white border border-black/5 active:scale-[0.98] transition"
            >
              {/* IMAGE */}
              <div className="relative w-full h-40 overflow-hidden">
                {b.coverImage ? (
                  <img
                    src={b.coverImage}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-sm text-gray-400">
                    Sin imagen
                  </div>
                )}

                {/* RATING */}
                <div className="absolute top-3 left-3 flex items-center gap-1 bg-black text-white text-xs px-3 py-1 rounded-full shadow">
                  <Star className="w-3.5 h-3.5 fill-white" />
                  <span className="font-medium">
                    {b.ratingAvg.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* INFO */}
              <div className="p-3 space-y-1.5">
                <h2 className="font-semibold text-sm line-clamp-1">
                  {b.name}
                </h2>

                <p className="text-xs text-gray-500 line-clamp-1">
                  {b.address || "Sin dirección"}
                </p>

                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {b.ratingCount} reseñas
                  </span>

                  <span className="text-indigo-500">
                    {b.servicesCount} servicios
                  </span>
                </div>

                {/* SERVICES PREVIEW */}
                <div className="mt-2 space-y-1">
                  {b.servicesPreview.slice(0, 2).map((s: any, i: number) => (
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