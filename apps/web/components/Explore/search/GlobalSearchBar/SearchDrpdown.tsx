"use client";

import { MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { CategoryIcon } from "@/components/shared/Icon";
import { Skeleton } from "@/components/ui/skeleton";

const filters = [
  { label: "Todo", value: "all" },
  { label: "Lugares", value: "branches" },
  { label: "Servicios", value: "services" },
  { label: "Profesionales", value: "staff" },
];

export default function SearchDropdown({
  results,
  loading,
  type,
  setType,
  hasFetched
}: any) {
  const hasResults =
    (type === "branches" && results.branches?.length > 0) ||
    (type === "services" && results.services?.length > 0) ||
    (type === "staff" && results.staff?.length > 0) ||
    (type === "all" &&
      (results.branches?.length ||
        results.services?.length ||
        results.staff?.length));

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="
        absolute top-full mt-2 w-full 
        bg-white rounded-2xl shadow-xl border z-[9999]

        h-155   /* 🔥 ALTURA FIJA */
        flex flex-col
        overflow-hidden
      "
    >
      {/* ========================= */}
      {/* HEADER (NO SCROLL) */}
      {/* ========================= */}
      <div className="p-4  bg-white">
        <div className="flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setType(f.value)}
              className={`
                px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition
                ${
                  type === f.value
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================= */}
      {/* CONTENT SCROLL */}
      {/* ========================= */}
      <div className="relative flex-1 overflow-y-auto p-4 space-y-4">
        {/* 🔥 CONTENT REAL */}
        <div
          className={`space-y-4 transition-opacity duration-200 ${
            loading ? "opacity-60" : "opacity-100"
          }`}
        >
          {(type === "all" || type === "branches") &&
            results.branches?.length > 0 && (
              <Section title="Lugares">
                {results.branches.map((b: any) => (
                  <Item
                    key={`branch-${b.id}`}
                    icon={
                      b.coverImage ? (
                        <img
                          src={b.coverImage}
                          className="w-10 h-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100">
                          <MapPin className="w-4 h-4" />
                        </div>
                      )
                    }
                    title={b.name}
                    subtitle={b.address}
                  />
                ))}
              </Section>
            )}

          {(type === "all" || type === "services") &&
            results.services?.length > 0 && (
              <Section title="Servicios">
                {results.services.map((s: any) => (
                  <Item
                    key={`service-${s.id}`}
                    icon={
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white border">
                        <CategoryIcon
                          name={s.icon}
                          className="w-4 h-4 text-indigo-500"
                        />
                      </div>
                    }
                    title={s.name}
                    subtitle={`${s.durationMin} min`}
                  />
                ))}
              </Section>
            )}

          {(type === "all" || type === "staff") &&
            results.staff?.length > 0 && (
              <Section title="Profesionales">
                {results.staff.map((s: any) => (
                  <Item
                    key={`staff-${s.id}`}
                    icon={<StaffAvatar staff={s} />}
                    title={s.name}
                    subtitle={s.role}
                  />
                ))}
              </Section>
            )}

          {/* EMPTY */}
          {hasFetched && !loading && !hasResults && (
            <div className="text-sm text-gray-400 text-center py-10">
              No se encontraron resultados
            </div>
          )}
        </div>

        {/* ========================= */}
        {/* 🔥 SKELETON OVERLAY */}
        {/* ========================= */}
        {loading && (
          <div className="absolute inset-0 p-4 bg-white/60 backdrop-blur-[2px]">
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonItem key={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ========================= */

function Section({ title, children }: any) {
  return (
    <div>
      <h4 className="text-sm font-medium text-black mb-2">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

/* ========================= */

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

/* ========================= */

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

/* ========================= */
/* 🔥 SKELETON */
/* ========================= */

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