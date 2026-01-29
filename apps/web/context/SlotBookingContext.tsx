"use client";

import React, { createContext, useContext, useMemo, useReducer } from "react";
import { DateTime } from "luxon";

/* =========================
   CONSTANTS & HELPERS
========================= */

const STEP_MIN = 15;

function ceilToStep(iso: string) {
  const dt = DateTime.fromISO(iso);
  const remainder = dt.minute % STEP_MIN;

  if (remainder === 0 && dt.second === 0 && dt.millisecond === 0) {
    return dt.toUTC().toISO()!;
  }

  return dt
    .plus({ minutes: STEP_MIN - remainder })
    .startOf("minute")
    .toUTC()
    .toISO()!;
}

/* =========================
   TYPES
========================= */
export type PendingService = {
  serviceId: string;
  durationMin: number;
};

export type SlotServiceItem = {
  serviceId: string;
  serviceName: string;
  staffId: string | "ANY";
  staffName?: string;
  durationMin: number;
  startIso: string; // UTC, calculado
};

export type SlotBookingState = {
  branchId: string | null;

  // pinned
  pinnedStartIso: string | null;
  pinnedStaffId: string | null;
  pinnedStaffName: string | null;

  client?: {
    id: string;
    name: string;
  } | null;

  // chain
  services: SlotServiceItem[];
  pendingService: PendingService | null;

  // ui
  step: 1 | 2 | 3;
};

type Action =
  | {
      type: "INIT_SLOT";
      payload: {
        branchId: string;
        pinnedStartIso: string;
        pinnedStaffId: string;
        pinnedStaffName: string; // ✅
      };
    }
  | {
      type: "ADD_SERVICE";
      payload: {
        serviceId: string;
        serviceName: string;

        staffId: string | "ANY";
        staffName?: string;

        durationMin: number;
      };
    }
  | { type: "REMOVE_LAST_SERVICE" }
  | {
      type: "SET_STAFF_FOR_SERVICE";
      payload: {
        index: number;
        staffId: string | "ANY";
        staffName?: string;
      };
    }
  | { type: "SET_PENDING_SERVICE"; payload: PendingService | null }
  | { type: "SET_STEP"; payload: SlotBookingState["step"] }
  | { type: "SET_CLIENT"; payload: SlotBookingState["client"] }
  | { type: "CLEAR_CLIENT" }
  | { type: "RESET" };

/* =========================
   INITIAL STATE
========================= */

const initialState: SlotBookingState = {
  branchId: null,

  pinnedStartIso: null,
  pinnedStaffId: null,
  pinnedStaffName: null,

  client: null,

  services: [],
  pendingService: null,

  step: 1,
};

/* =========================
   REDUCER
========================= */

function reducer(state: SlotBookingState, action: Action): SlotBookingState {
  switch (action.type) {
    case "INIT_SLOT": {
      return {
        ...initialState,
        branchId: action.payload.branchId,
        pinnedStartIso: action.payload.pinnedStartIso,
        pinnedStaffId: action.payload.pinnedStaffId,
        pinnedStaffName: action.payload.pinnedStaffName,
      };
    }

    case "ADD_SERVICE": {
      if (!state.pinnedStartIso) return state;

      const prev = state.services[state.services.length - 1];

      const rawStartIso = prev
        ? DateTime.fromISO(prev.startIso)
            .plus({ minutes: prev.durationMin })
            .toISO()!
        : state.pinnedStartIso;

      const startIso = ceilToStep(rawStartIso);

      const isFirstService = state.services.length === 0;

      return {
        ...state,
        services: [
          ...state.services,
          {
            serviceId: action.payload.serviceId,
            serviceName: action.payload.serviceName,

            staffId: action.payload.staffId,
            staffName: action.payload.staffName,

            durationMin: action.payload.durationMin,
            startIso,
          },
        ],
        step: isFirstService ? 2 : state.step, // 👈 🔥 CLAVE
      };
    }

    case "REMOVE_LAST_SERVICE": {
      const nextServices = state.services.slice(0, -1);

      return {
        ...state,
        services: nextServices,
        step: nextServices.length === 0 ? 1 : state.step,
      };
    }

    case "SET_STAFF_FOR_SERVICE": {
      const services = [...state.services];
      const current = services[action.payload.index];
      if (!current) return state;

      services[action.payload.index] = {
        ...current,
        staffId: action.payload.staffId,
        staffName:
          action.payload.staffId === "ANY"
            ? undefined
            : action.payload.staffName,
      };

      return { ...state, services };
    }

    case "SET_PENDING_SERVICE":
      return {
        ...state,
        pendingService: action.payload,
      };

    case "SET_CLIENT":
      return { ...state, client: action.payload };

    case "CLEAR_CLIENT":
      return { ...state, client: null };

    case "SET_STEP":
      return { ...state, step: action.payload };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

/* =========================
   CONTEXT
========================= */

type Ctx = {
  state: SlotBookingState;
  actions: {
    initSlot(params: {
      branchId: string;
      pinnedStartIso: string;
      pinnedStaffId: string;
      pinnedStaffName: string;
    }): void;

    addService(params: {
      serviceId: string;
      serviceName: string;

      staffId: string | "ANY";
      staffName?: string;

      durationMin: number;
    }): void;

    removeLastService(): void;
    setStaffForService(index: number, staffId: string | "ANY"): void;

    setStep(step: SlotBookingState["step"]): void;
    nextStep(): void;
    prevStep(): void;

    setClient(): void;
    clearClient():void;

    reset(): void;
  };
};

const SlotBookingContext = createContext<Ctx | null>(null);

/* =========================
   PROVIDER
========================= */

export function SlotBookingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions = useMemo<Ctx["actions"]>(() => {
    return {
      initSlot: (payload) => dispatch({ type: "INIT_SLOT", payload }),

      addService: (payload) => dispatch({ type: "ADD_SERVICE", payload }),

      removeLastService: () => dispatch({ type: "REMOVE_LAST_SERVICE" }),

      setStaffForService(
        index: number,
        staffId: string | "ANY",
        staffName?: string
      ) {
        dispatch({
          type: "SET_STAFF_FOR_SERVICE",
          payload: { index, staffId, staffName },
        });
      },

      setPendingService(service) {
        dispatch({ type: "SET_PENDING_SERVICE", payload: service });
      },

      setStep: (step) => dispatch({ type: "SET_STEP", payload: step }),

      nextStep: () =>
        dispatch({
          type: "SET_STEP",
          payload: Math.min(state.step + 1, 3) as SlotBookingState["step"],
        }),

      prevStep: () =>
        dispatch({
          type: "SET_STEP",
          payload: Math.max(state.step - 1, 1) as SlotBookingState["step"],
        }),

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setClient: (client: any) => dispatch({ type: "SET_CLIENT", payload: client }),

      clearClient: () => dispatch({ type: "CLEAR_CLIENT" }),

      reset: () => dispatch({ type: "RESET" }),
    };
  }, [state.step]);

  return (
    <SlotBookingContext.Provider value={{ state, actions }}>
      {children}
    </SlotBookingContext.Provider>
  );
}

/* =========================
   HOOK
========================= */

export function useSlotBooking() {
  const ctx = useContext(SlotBookingContext);
  if (!ctx) {
    throw new Error("useSlotBooking must be used inside SlotBookingProvider");
  }
  return ctx;
}
