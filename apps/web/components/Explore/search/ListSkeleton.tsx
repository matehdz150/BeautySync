// components/Explore/search/ExploreListSkeleton.tsx

"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function ExploreListSkeleton() {
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl overflow-hidden bg-white border border-black/5"
        >
          {/* IMAGE */}
          <Skeleton className="w-full h-48" />

          {/* INFO */}
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />

            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>

            <div className="space-y-2 mt-3">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}