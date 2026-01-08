"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/context/BranchContext";
import { getServicesByBranch } from "@/lib/services/services";
import { Search } from "lucide-react";
import { useAppointmentBuilder } from "@/context/AppointmentBuilderContext";

type Service = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
  category?: {
    id: string;
    name: string;
    colorHex: string;
  } | null;
};

export function StepServices({
  onSelect,
}: {
  onSelect: (service: Service) => void;
}) {
  const { branch } = useBranch();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const { addService } = useAppointmentBuilder();

  //
  // LOAD FROM API
  //
  useEffect(() => {
    if (!branch) return;

    setLoading(true);

    getServicesByBranch(branch.id)
      .then((res) => setServices(res ?? []))
      .finally(() => setLoading(false));
  }, [branch]);

  //
  // SEARCH
  //
  const filtered = useMemo(() => {
    return services.filter((s) =>
      s.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [services, query]);

  //
  // GROUP BY CATEGORY
  //
  const grouped = useMemo(() => {
    const map: Record<string, { color: string; services: Service[] }> = {};

    filtered.forEach((s) => {
      const key = s.category?.name ?? "Other";
      const color = s.category?.colorHex ?? "#E5E7EB";

      if (!map[key]) map[key] = { color, services: [] };
      map[key].services.push(s);
    });

    return map;
  }, [filtered]);

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* HEADER SEARCH */}
      <div className="px-5 pt-2 pb-3 sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />

          <Input
            placeholder="Search service name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 py-6 shadow-none"
          />
        </div>
      </div>

      {/* LIST SCROLL */}
      <div className="px-5 overflow-y-auto flex-1 space-y-8">
        {loading && (
          <>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </>
        )}

        {!loading &&
          Object.entries(grouped).map(([cat, { color, services }]) => (
            <div key={cat} className="space-y-3">
              <div className="flex items-center gap-2 mt-2">
                <p className="font-medium">{cat}</p>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                  {services.length}
                </span>
              </div>

              <div className="space-y-2">
                {services.map((s) => (
                  <button
                    key={s.id}
                    className="w-full flex items-center justify-between gap-4 px-3 py-3 rounded-md hover:bg-[#f3f3f3] transition"
                    onClick={() => {
                      addService(s);
                      onSelect?.(s);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-1.5 h-10 rounded-full"
                        style={{ backgroundColor: color }}
                      />

                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground text-left">
                          {s.durationMin} min
                        </p>
                      </div>
                    </div>

                    <p className="font-medium">
                      ${(s.priceCents / 100).toFixed(2)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}

        {!loading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No services found
          </p>
        )}
      </div>
    </div>
  );
}
