"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useBranch } from "@/context/BranchContext";
import { useStaffDraft } from "@/context/StaffDraftContext";
import { getServicesByBranch } from "@/lib/services/services";
import { Button } from "@/components/ui/button";

/* =====================
   PAGE
===================== */

export default function StaffServicesPage() {
  const { branch } = useBranch();
  const { state, dispatch } = useStaffDraft();

  const [services, setServices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  /* =====================
     FETCH SERVICES
  ===================== */

  useEffect(() => {
    if (!branch?.id) return;

    async function load() {
      setLoading(true);
      try {
        const res = await getServicesByBranch(branch.id);
        setServices(res ?? []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [branch?.id]);

  /* =====================
     FILTER
  ===================== */

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return services.filter((s) => s.name.toLowerCase().includes(q));
  }, [services, search]);

  /* =====================
     RENDER
  ===================== */

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-semibold">Servicios</h2>
        <p className="text-muted-foreground">
          Selecciona los servicios que este staff puede realizar
        </p>
      </div>

      {/* SEARCH */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar servicios…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* LIST */}
      <div className="space-y-2">
        {loading && (
          <p className="text-sm text-muted-foreground">Cargando servicios…</p>
        )}

        {!loading && filtered.length === 0 && (
          <div className="rounded-xl border p-6 text-center text-muted-foreground">
            No hay servicios disponibles
          </div>
        )}

        {!loading &&
          filtered.map((service) => {
            const checked = state.services.includes(service.id);

            function toggle() {
              dispatch({
                type: "TOGGLE_SERVICE",
                payload: { serviceId: service.id },
              });
            }

            return (
              <div
                key={service.id}
                role="button"
                tabIndex={0}
                onClick={toggle}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle();
                  }
                }}
                className={cn(
                  "flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition",
                  checked
                    ? "border-indigo-400 bg-indigo-50"
                    : "hover:bg-gray-50"
                )}
              >
                {/* Checkbox */}
                <Checkbox
                  checked={checked}
                  onClick={(e) => e.stopPropagation()} // 👈 CLAVE
                  onCheckedChange={toggle}
                />

                {/* COLOR */}
                <div
                  className="w-1 h-10 rounded-full"
                  style={{
                    backgroundColor: service.categoryColor ?? "#A78BFA",
                  }}
                />

                {/* INFO */}
                <div className="flex-1">
                  <p className="font-medium">{service.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {service.durationMin} min
                  </p>
                </div>

                {/* PRICE */}
                <p className="font-medium">
                  ${(service.priceCents / 100).toFixed(2)}
                </p>
              </div>
            );
          })}
      </div>
    </div>
  );
}
