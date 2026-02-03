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

import { HorizontalDatePicker } from "./TimeSide/HorizontalDatePicker";

/* =====================
   DATE HELPERS
===================== */

function todayISO() {
  return DateTime.now().setZone("America/Mexico_City").toISODate()!;
}

function isoToDate(iso: string) {
  return DateTime.fromISO(iso, {
    zone: "America/Mexico_City",
  }).toJSDate();
}

function dateToISO(date: Date) {
  return DateTime.fromJSDate(date)
    .setZone("America/Mexico_City")
    .toISODate()!;
}

/* =====================
   COMPONENT
===================== */

export function StepPlan() {
  const { branch } = useBranch();
  const { state, actions } = useBookingManagerDraft();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // source of truth
  const selectedDate = state.date ?? todayISO();

  /* =====================
     VALIDATIONS
  ===================== */

  const staffReady = useMemo(() => {
    if (!state.services.length) return false;

    if (state.staffChoiceMode === "ANY") return true;

    if (state.staffChoiceMode === "SINGLE_STAFF") {
      return !!state.singleStaffId;
    }

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

  /* =====================
     REQUEST KEY (ANTI LOOP)
  ===================== */

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

  /* =====================
     HANDLERS
  ===================== */

  const handleSelectDate = useCallback(
    (iso: string) => {
      actions.setDate(iso);
      actions.selectPlan(null);
      actions.setPlans([]);
      setError(null);

      // 🔥 permitir nuevo fetch
      lastRequestKeyRef.current = null;
    },
    [actions]
  );

  /* =====================
     FETCH PLANS
  ===================== */

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

      // ordenar servicios por duración DESC
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
      setError("No available times for this date");
    } finally {
      setLoading(false);
    }
  }

  /* =====================
     AUTO FETCH
  ===================== */

  useEffect(() => {
    if (!branch?.id) return;

    if (!state.date) {
      actions.setDate(selectedDate);
      return;
    }

    if (!canFetch) return;

    if (lastRequestKeyRef.current === requestKey) return;
    lastRequestKeyRef.current = requestKey;

    fetchPlans(state.date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch?.id, canFetch, requestKey, state.date, selectedDate]);

  /* =====================
     DERIVED
  ===================== */

  const plans = state.plans as AvailabilityChainPlan[];

  const selectedPlan = useMemo(() => {
    if (!state.selectedPlanStartIso) return null;
    return plans.find((p) => p.startIso === state.selectedPlanStartIso) ?? null;
  }, [plans, state.selectedPlanStartIso]);

  /* =====================
     UI GUARDS
  ===================== */

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

  /* =====================
     RENDER
  ===================== */

  return (
    <div className="space-y-5">
      {/* DATE PICKER */}
      <div className="space-y-2">

        <HorizontalDatePicker
          value={isoToDate(selectedDate)}
          onChange={(date) => handleSelectDate(dateToISO(date))}
        />
      </div>

      {/* TIMES */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Disponibilidad</p>

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
                  </div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    {p.assignments.length} servicios •{" "}
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
    </div>
  );
}