"use client";

import { useEffect, useState } from "react";
import { getStaffByBranch, Staff } from "@/lib/services/staff";
import { useTimeOffDraft, useTimeOffActions } from "@/context/TimeOffDraftContext";

type Props = {
  branchId: string;
};

export function StaffSelector({ branchId }: Props) {
  const { state } = useTimeOffDraft();
  const { setStaff } = useTimeOffActions();

  const [staff, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await getStaffByBranch(branchId);
        if (mounted) setStaffList(data);
      } catch (e) {
        console.error("Error loading staff", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [branchId]);

  if (loading) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">Staff</p>
        <div className="text-sm text-muted-foreground">
          Cargando staff...
        </div>
      </div>
    );
  }

  if (!staff.length) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">Staff</p>
        <div className="text-sm text-muted-foreground">
          No hay staff disponible
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Staff</p>

      <div className="flex flex-wrap gap-2">
        {staff.map((s) => {
          const active = state.staffId === s.id;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStaff(s.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition ${
                active
                  ? "bg-black text-white border-black"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              {/* Avatar */}
              {s.imageUrl ? (
                <img
                  src={s.imageUrl}
                  alt={s.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                  {s.name.charAt(0)}
                </div>
              )}

              <span>{s.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}