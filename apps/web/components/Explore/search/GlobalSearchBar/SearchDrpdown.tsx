"use client";

import { MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { CategoryIcon } from "@/components/shared/Icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const filters = [
  { label: "Todo", value: "all" },
  { label: "Lugares", value: "branches" },
  { label: "Servicios", value: "services" },
  { label: "Profesionales", value: "staff" },
];

export default function SearchDropdown({
  results,
  loading,
  loadingMore,
  loadMore,
  type,
  setType,
}: any) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();

  const hasResults =
    (type === "branches" && results.branches.items.length > 0) ||
    (type === "services" && results.services.items.length > 0) ||
    (type === "staff" && results.staff.items.length > 0) ||
    (type === "all" &&
      (results.branches.items.length ||
        results.services.items.length ||
        results.staff.items.length));

  const hasNext =
    (type === "branches" && results.branches.nextCursor) ||
    (type === "services" && results.services.nextCursor) ||
    (type === "staff" && results.staff.nextCursor);

  const shouldShowLoadMore = type !== "all" && Boolean(hasNext);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !shouldShowLoadMore || loadingMore || loading) return;

    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

    if (distanceToBottom < 140) {
      loadMore();
    }
  }, [loadMore, loadingMore, loading, shouldShowLoadMore]);

  // 🔥 fix mobile: si todavía no hay suficiente contenido para scrollear,
  // dispara más páginas automáticamente
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !shouldShowLoadMore || loading || loadingMore) return;

    const notScrollableYet = el.scrollHeight <= el.clientHeight + 40;

    if (notScrollableYet) {
      loadMore();
    }
  }, [results, shouldShowLoadMore, loading, loadingMore, loadMore]);

  return (
    <motion.div
      initial={{ opacity: 0, y: isMobile ? 20 : -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={
        isMobile
          ? "fixed inset-0 z-[9999] bg-white flex flex-col"
          : "absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border z-[9999] h-155 flex flex-col overflow-hidden"
      }
    >
      <div className={`p-4 ${isMobile ? "border-b" : ""}`}>
        <div className="flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setType(f.value)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition ${
                type === f.value
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto space-y-4 ${
          isMobile ? "p-4 pb-10" : "p-4"
        }`}
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        {(type === "all" || type === "branches") &&
          results.branches.items.map((b: any) => (
            <Item
              key={b.id}
              icon={
                b.coverImage ? (
                  <img
                    src={b.coverImage}
                    className="w-10 h-10 rounded-md object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full">
                    <MapPin className="w-4 h-4" />
                  </div>
                )
              }
              title={b.name}
              subtitle={b.address}
            />
          ))}

        {(type === "all" || type === "services") &&
          results.services.items.map((s: any) => (
            <Item
              key={s.id}
              icon={
                <div className="w-10 h-10 flex items-center justify-center rounded-full border">
                  <CategoryIcon name={s.icon} className="w-4 h-4" />
                </div>
              }
              title={s.name}
              subtitle={`${s.durationMin} min`}
            />
          ))}

        {(type === "all" || type === "staff") &&
          results.staff.items.map((s: any) => (
            <Item
              key={s.id}
              icon={<StaffAvatar staff={s} />}
              title={s.name}
              subtitle={s.role}
            />
          ))}

        {shouldShowLoadMore && (
          <div className="flex justify-center py-3">
            {loadingMore ? (
              <div className="text-xs text-gray-400 animate-pulse">
                Cargando más...
              </div>
            ) : (
              <div className="h-5" />
            )}
          </div>
        )}

        {!loading && !hasResults && (
          <div className="text-sm text-gray-400 text-center py-10">
            No se encontraron resultados
          </div>
        )}
      </div>

      {loading && !loadingMore && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] p-4">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonItem key={i} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function Item({ icon, title, subtitle }: any) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition">
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-gray-500 truncate">{subtitle}</p>
      </div>
    </div>
  );
}

function StaffAvatar({ staff }: any) {
  if (staff.avatarUrl) {
    return (
      <img
        src={staff.avatarUrl}
        className="w-10 h-10 rounded-full object-cover"
      />
    );
  }

  const initials = getInitials(staff.name);

  return (
    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white text-xs font-medium">
      {initials}
    </div>
  );
}

function getInitials(name?: string) {
  if (!name) return "?";

  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();

  return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
}

function SkeletonItem() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-md" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-10 w-[70%]" />
        <Skeleton className="h-2 w-[40%]" />
      </div>
    </div>
  );
}