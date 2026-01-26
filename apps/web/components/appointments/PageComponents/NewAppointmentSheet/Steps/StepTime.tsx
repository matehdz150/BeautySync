"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useBranch } from "@/context/BranchContext";
import { useBookingManagerDraft } from "@/context/BookingManagerDraftContext";
import {
  getAvailabilityChainManager,
  type AvailabilityChainPlan,
  type AvailabilityChainRequest,
} from "@/lib/services/availability";

function todayISO() {
  return DateTime.now().setZone("America/Mexico_City").toISODate()!;
}

export function StepPlan() {
  const { branch } = useBranch();
  const { state, actions } = useBookingManagerDraft();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // date local state (source of truth: draft.state.date)
  const selectedDate = state.date ?? todayISO();

  // ============================
  // VALIDACIONES
  // ============================

  const canFetch = useMemo(() => {
    if (!branch?.id) return false;
    if (!state.services.length) return false;

    // StepStaff debe dejar listo staffByService o ANY
    return actions.isStep3Ready();
  }, [branch?.id, state.services.length, actions, state.staffChoiceMode, state.singleStaffId, state.staffByService]);

  // ============================
  // HANDLERS
  // ============================

  const handleSelectDate = useCallback(
    (iso: string) => {
      const next = iso.slice(0, 10);
      actions.setDate(next);
      actions.selectPlan(null); // limpiar selección
    },
    [actions]
  );

  // ============================
  // FETCH PLANS (CHAIN)
  // ============================

  const fetchPlans = useCallback(
    async (date: string) => {
      if (!branch?.id) return;
      if (!state.services.length) return;

      setLoading(true);
      setError(null);

      try {
        const body: AvailabilityChainRequest = actions.buildChainDraftPayload();

        // body ya trae date del state.date, pero por seguridad:
        body.date = date;

        // 🔥 orden estable (como público): primero servicios más largos
        // para que el solver sea más eficiente y consistente
        const durationByService = new Map(
          state.services.map((s) => [s.id, s.durationMin])
        );

        body.chain = [...body.chain].sort((a, b) => {
          const da = durationByService.get(a.serviceId) ?? 0;
          const db = durationByService.get(b.serviceId) ?? 0;
          return db - da;
        });

        const plans = await getAvailabilityChainManager({
          branchId: branch.id,
          body,
        });

        actions.setPlans(plans as any);
        actions.selectPlan(null);
      } catch (e: any) {
        console.error(e);
        actions.setPlans([]);
        actions.selectPlan(null);
        setError("No availability for this date");
      } finally {
        setLoading(false);
      }
    },
    [branch?.id, branch?.id, state.services, actions]
  );

  // Auto-fetch al entrar o cuando cambie date/staff/services
  useEffect(() => {
    if (!canFetch) return;

    // asegura que draft tenga date
    if (!state.date) {
      actions.setDate(selectedDate);
      return;
    }

    fetchPlans(state.date);
  }, [
    canFetch,
    state.date,
    state.services,
    state.staffChoiceMode,
    state.singleStaffId,
    state.staffByService,
    fetchPlans,
    actions,
    selectedDate,
  ]);

  // ============================
  // DERIVADOS
  // ============================

  const plans = state.plans as unknown as AvailabilityChainPlan[];

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

  if (!actions.isStep3Ready()) {
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
      {/* DATE PICKER SIMPLE */}
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

                  {/* preview mini del chain */}
                  <div className="mt-1 text-xs text-muted-foreground">
                    {p.assignments.length} services •{" "}
                    {p.assignments
                      .map((a) => {
                        const srv = state.services.find((s) => s.id === a.serviceId);
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

      {/* DEBUG / SUMMARY */}
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