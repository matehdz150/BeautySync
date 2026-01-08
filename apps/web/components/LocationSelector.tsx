"use client";

import * as React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { MapPin, ChevronDown, Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useBranch } from "@/context/BranchContext";
import { fetchBranchesByOrg } from "@/lib/services/branches";
import { api } from "@/lib/services/api";

type Branch = {
  id: string;
  name: string;
  address?: string | null;
};

export function LocationSelector() {
  const { user } = useAuth();
  const { branch, setBranch } = useBranch();

  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [loading, setLoading] = React.useState(false);

  const isStaff = user?.role === "staff";

  //
  // FETCH
  //
  React.useEffect(() => {
    if (!user) return;

    if (isStaff) {
      api(`/branches/by-user/${user.id}`).then((res) => {
        setBranch(res.branch);
      });
      return;
    }

    if (user.orgId) {
      setLoading(true);

      fetchBranchesByOrg(user.orgId)
        .then((data) => {
          setBranches(data);
          if (!branch && data.length > 0) setBranch(data[0]);
        })
        .finally(() => setLoading(false));
    }
  }, [user?.id, user?.orgId, isStaff]);

  //
  // 🚨 MUY IMPORTANTE:
  // NO CAMBIAMOS disabled por rol.
  //
  const triggerDisabled = false;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          disabled={triggerDisabled}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted transition rounded-2xl border"
        >
          <MapPin size={16} />

          <span className="text-sm">
            {branch?.name ?? "Sin sucursal"}
          </span>

          {!isStaff && <ChevronDown size={16} />}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-72 p-2">
        {/* STAFF → Solo informativo */}
        {isStaff && (
          <p className="p-3 text-sm text-muted-foreground">
            Tu sucursal está asignada: <strong>{branch?.name}</strong>
          </p>
        )}

        {/* OWNER/MANAGER → Selector real */}
        {!isStaff && (
          <>
            {loading && (
              <div className="flex items-center gap-2 p-3 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando sucursales…
              </div>
            )}

            {!loading &&
              branches.map((b) => {
                const active = b.id === branch?.id;

                return (
                  <button
                    key={b.id}
                    onClick={() => setBranch(b)}
                    className={`text-left px-3 py-2 transition ${
                      active ? "bg-accent" : "hover:bg-accent/60"
                    }`}
                  >
                    <p className="font-medium">{b.name}</p>

                    {b.address && (
                      <p className="text-xs text-muted-foreground">
                        {b.address}
                      </p>
                    )}
                  </button>
                );
              })}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}