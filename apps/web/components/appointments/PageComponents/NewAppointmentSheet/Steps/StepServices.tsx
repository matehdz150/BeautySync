"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/context/BranchContext";
import { getServicesByBranch } from "@/lib/services/services";
import { Search } from "lucide-react";
import {
  useAppointmentBuilder,
  Service as ServiceType,
} from "@/context/AppointmentBuilderContext";
import { useCalendar } from "@/context/CalendarContext";
import { EmptyServicesState } from "./EmptyServicesState";
import { EmptyNoAvailabilityState } from "./EmptyNoAvailabilityState";

type Service = ServiceType;

export function StepServices({
  onSelect,
  defaultStaffId,
  startISO,
}: {
  onSelect: (service: Service) => void;
  defaultStaffId?: string;
  startISO?: string;
}) {
  const { branch } = useBranch();
  const { addService } = useAppointmentBuilder();
  const { state } = useCalendar();

  const selectedStaff = defaultStaffId
    ? state.staff.find((s: any) => s.id === defaultStaffId)
    : undefined;

  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const preset = state.prefill?.presetServices;

  // Si vienes del GRID → usa preset
  // Si NO → carga del branch
  useEffect(() => {
    // 👈 CLAVE: preset !== undefined
    if (preset !== undefined) {
      setAllServices(preset);
      setLoading(false);
      return;
    }

    if (!branch) return;

    setLoading(true);

    getServicesByBranch(branch.id)
      .then((res) => setAllServices(res ?? []))
      .finally(() => setLoading(false));
  }, [branch, preset]);

  const filtered = useMemo(
    () =>
      allServices.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase())
      ),
    [allServices, query]
  );

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

  const fromGrid = preset !== undefined;

  return (
    <div className="flex flex-col">
      {/* 🔍 BARRA DE BÚSQUEDA (FIJA ARRIBA) */}
      <div className="px-5 pt-2 pb-3 sticky top-0 z-10 bg-white">
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

      {/* 🧾 LISTA SCROLLEABLE */}
      <div className="px-5 pb-4">
        <div className="space-y-8 max-h-145 overflow-y-auto pr-1">
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
                      className="w-full flex items-center justify-between gap-4 px-3 py-3 border rounded-md hover:bg-[#f3f3f3]"
                      onClick={() => {
                        addService(s, {
                          staffId: defaultStaffId,
                          staffName: selectedStaff?.name,
                          startISO,
                        });
                        onSelect?.(s);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-1.5 h-10 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <div className="text-start">
                          <p className="font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">
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

          {!loading &&
            filtered.length === 0 &&
            (fromGrid ? <EmptyNoAvailabilityState /> : <EmptyServicesState />)}
        </div>
      </div>
    </div>
  );
}
