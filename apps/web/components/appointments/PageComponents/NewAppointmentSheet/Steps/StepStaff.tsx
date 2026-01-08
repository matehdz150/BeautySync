"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/context/BranchContext";
import { getStaffForService } from "@/lib/services/staff";

type Staff = {
  id: string;
  name: string;
  photoUrl?: string;
};

export function StepStaff({
  serviceId,
  value,
  onChange,
  onNext,
  allowAny = true,
}: {
  serviceId?: string;         // <-- selected service
  value?: string;             // <-- selected staffId
  onChange: (id?: string) => void;
  onNext: () => void;
  allowAny?: boolean;
}) {
  const { branch } = useBranch();

  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);

  //
  // LOAD STAFF
  //
  useEffect(() => {
    if (!branch || !serviceId) return;

    setLoading(true);

    getStaffForService(branch.id, serviceId)
      .then((res) => setStaff(res ?? []))
      .finally(() => setLoading(false));
  }, [branch, serviceId]);

  return (
    <div className="space-y-6">

      <h2 className="text-xl font-semibold">Select a team member</h2>

      {loading && (
        <>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </>
      )}

      {!loading && (
        <div className="space-y-2">

          {allowAny && (
            <button
              className={`
                w-full px-4 py-3 rounded-md border flex items-center
                ${!value ? "bg-muted" : "hover:bg-muted"}
              `}
              onClick={() => onChange(undefined)}
            >
              Any team member
            </button>
          )}

          {staff.map((s) => {
            const selected = value === s.id;

            return (
              <button
                key={s.id}
                className={`
                  w-full px-4 py-3 rounded-md border flex items-center gap-3
                  ${selected ? "bg-muted" : "hover:bg-muted"}
                `}
                onClick={() => onChange(s.id)}
              >
                {s.photoUrl ? (
                  <img
                    src={s.photoUrl}
                    className="w-8 h-8 rounded-full"
                    alt={s.name}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted" />
                )}

                <span className="font-medium">{s.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {!loading && staff.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No team members available for this service
        </p>
      )}

      {/* FOOTER */}
      <Button
        className="w-full"
        disabled={value === undefined && !allowAny}
        onClick={onNext}
      >
        Continue
      </Button>
    </div>
  );
}