"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DateTime } from "luxon";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useBranch } from "@/context/BranchContext";
import { useBookingManagerDraft } from "@/context/BookingManagerDraftContext";

import {
  getManagerAvailabilityChain,
  type AvailabilityChainPlan,
  type AvailabilityChainRequestBody,
} from "@/lib/services/availability";

function todayISO() {
  return DateTime.now().setZone("America/Mexico_City").toISODate()!;
}

export function StepPlan() {
  const { branch } = useBranch();
  const { state, actions } = useBookingManagerDraft();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // source of truth: draft.state.date
  const selectedDate = state.date ?? todayISO();

  // ============================
  // ✅ VALIDACIÓN REAL PARA PODER FETCH
  // ============================

  const staffReady = useMemo(() => {
    if (!state.services.length) return false;

    if (state.staffChoiceMode === "ANY") return true;

    if (state.staffChoiceMode === "SINGLE_STAFF") {
      return !!state.singleStaffId;
    }

    // PER_SERVICE: puede ser "ANY" o string staffId
    return state.services.every((s) => {
      const v = state.staffByService[s.id];
      return typeof v === "string" && v.length > 0;
    });
  }, [
    state.services,
    state.staffChoiceMode,
    state.singleStaffId,
    state.staffByService,
  ]);

  const canFetch = useMemo(() => {
    if (!branch?.id) return false;
    if (!state.services.length) return false;
    if (!state.date) return false;
    return staffReady;
  }, [branch?.id, state.services.length, staffReady, state.date]);

  // ============================
  // 🔥 REQUEST KEY (ANTI LOOP)
  // ============================

  const requestKey = useMemo(() => {
    const serviceIds = state.services.map((s) => s.id).join(",");

    const staffKey =
      state.staffChoiceMode === "ANY"
        ? "ANY"
        : state.staffChoiceMode === "SINGLE_STAFF"
        ? `SINGLE:${state.singleStaffId ?? ""}`
        : `PER:${Object.entries(state.staffByService)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([sid, st]) => `${sid}:${st}`)
            .join("|")}`;

    return `${branch?.id ?? ""}|${state.date ?? ""}|${serviceIds}|${staffKey}`;
  }, [
    branch?.id,
    state.date,
    state.services,
    state.staffChoiceMode,
    state.singleStaffId,
    state.staffByService,
  ]);

  const lastRequestKeyRef = useRef<string | null>(null);

  // ============================
  // HANDLERS
  // ============================

  const handleSelectDate = useCallback(
    (iso: string) => {
      const next = iso.slice(0, 10);

      actions.setDate(next);
      actions.selectPlan(null);
      actions.setPlans([]);
      setError(null);

      // 🔥 reset anti-loop key para permitir refetch con nueva fecha
      lastRequestKeyRef.current = null;
    },
    [actions]
  );

  // ============================
  // FETCH PLANS (CHAIN)
  // ============================

  async function fetchPlans(date: string) {
    if (!branch?.id) return;
    if (!state.services.length) return;

    setLoading(true);
    setError(null);

    try {
      const body = actions.buildChainDraftPayload();

      const reqBody: AvailabilityChainRequestBody = {
        ...body,
        date,
      };

      // 🔥 orden estable: servicios más largos primero
      const durationByService = new Map(
        state.services.map((s) => [s.id, s.durationMin])
      );

      reqBody.chain = [...reqBody.chain].sort((a, b) => {
        const da = durationByService.get(a.serviceId) ?? 0;
        const db = durationByService.get(b.serviceId) ?? 0;
        return db - da;
      });

      const plans = await getManagerAvailabilityChain({
        branchId: branch.id,
        body: reqBody,
      });

      actions.setPlans(plans);
      actions.selectPlan(null);
    } catch (e) {
      console.error(e);
      actions.setPlans([]);
      actions.selectPlan(null);
      setError("No availability for this date");
    } finally {
      setLoading(false);
    }
  }

  // ============================
  // AUTO-FETCH CONTROLADO
  // ============================

  useEffect(() => {
    if (!branch?.id) return;

    // si no hay date, setearlo 1 vez y salir
    if (!state.date) {
      actions.setDate(selectedDate);
      return;
    }

    if (!canFetch) return;

    // 🔥 evita loop: no repitas el mismo request
    if (lastRequestKeyRef.current === requestKey) return;
    lastRequestKeyRef.current = requestKey;

    fetchPlans(state.date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch?.id, canFetch, requestKey, state.date, selectedDate]);

  // ============================
  // DERIVADOS
  // ============================

  const plans = state.plans as AvailabilityChainPlan[];

  const selectedPlan = useMemo(() => {
    if (!state.selectedPlanStartIso) return null;
    return plans.find((p) => p.startIso === state.selectedPlanStartIso) ?? null;
  }, [plans, state.selectedPlanStartIso]);

  // ============================
  // UI STATES
  // ============================

  if (!branch) {
    return <div className="py-8 text-sm text-muted-foreground">No branch</div>;
  }

  if (!state.services.length) {
    return (
      <div className="py-8 text-sm text-muted-foreground">
        Select services first.
      </div>
    );
  }

  if (!staffReady) {
    return (
      <div className="py-8 text-sm text-muted-foreground">
        Select staff first.
      </div>
    );
  }

  // ============================
  // RENDER
  // ============================

  return (
    <div className="space-y-5">
      {/* DATE PICKER */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Date</p>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => handleSelectDate(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* TIMES */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Available times</p>

        {loading && (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        )}

        {!loading && plans.length > 0 && (
          <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
            {plans.map((p) => {
              const isSelected = state.selectedPlanStartIso === p.startIso;

              return (
                <button
                  key={p.startIso}
                  type="button"
                  onClick={() => actions.selectPlan(p.startIso)}
                  className={cn(
                    "w-full px-4 py-3 rounded-md border-2 text-left transition",
                    isSelected
                      ? "border-indigo-500 bg-indigo-50"
                      : "hover:border-indigo-400"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{p.startLocalLabel}</span>

                    {isSelected && (
                      <span className="text-xs font-medium text-indigo-600">
                        Selected
                      </span>
                    )}
                  </div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    {p.assignments.length} services •{" "}
                    {p.assignments
                      .map((a) => {
                        const srv = state.services.find(
                          (s) => s.id === a.serviceId
                        );
                        return srv?.name ?? "Service";
                      })
                      .join(" → ")}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!loading && plans.length === 0 && (
          <div className="py-6 text-sm text-muted-foreground">
            {error ?? "No available times for this date."}
          </div>
        )}
      </div>

      {/* DETAILS */}
      {selectedPlan && (
        <div className="rounded-md border p-3 bg-muted/30">
          <p className="text-sm font-medium">Plan details</p>

          <div className="mt-2 space-y-2">
            {selectedPlan.assignments.map((a, idx) => {
              const srv = state.services.find((s) => s.id === a.serviceId);
              const start = DateTime.fromISO(a.startLocalIso).toFormat("HH:mm");
              const end = DateTime.fromISO(a.endLocalIso).toFormat("HH:mm");

              return (
                <div key={`${a.serviceId}-${idx}`} className="text-xs">
                  <span className="font-medium">{srv?.name ?? "Service"}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    • {start} - {end}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}