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
  staffId: string | "ANY";
  durationMin: number;
  startIso: string; // UTC, calculado
};

export type SlotBookingState = {
  branchId: string | null;

  // pinned
  pinnedStartIso: string | null;
  pinnedStaffId: string | null;

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
      };
    }
  | {
      type: "ADD_SERVICE";
      payload: {
        serviceId: string;
        staffId: string | "ANY";
        durationMin: number;
      };
    }
  | { type: "REMOVE_LAST_SERVICE" }
  | {
      type: "SET_STAFF_FOR_SERVICE";
      payload: {
        index: number;
        staffId: string | "ANY";
      };
    }
  | { type: "SET_PENDING_SERVICE"; payload: PendingService | null }
  | { type: "SET_STEP"; payload: SlotBookingState["step"] }
  | { type: "RESET" };

/* =========================
   INITIAL STATE
========================= */

const initialState: SlotBookingState = {
  branchId: null,

  pinnedStartIso: null,
  pinnedStaffId: null,

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

      return {
        ...state,
        services: [
          ...state.services,
          {
            serviceId: action.payload.serviceId,
            staffId: action.payload.staffId,
            durationMin: action.payload.durationMin,
            startIso,
          },
        ],
        // 👇 al agregar el primer servicio avanzamos a step 2
        step: state.services.length === 0 ? 2 : state.step,
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
      if (!services[action.payload.index]) return state;

      services[action.payload.index] = {
        ...services[action.payload.index],
        staffId: action.payload.staffId,
      };

      return { ...state, services };
    }

    case "SET_PENDING_SERVICE":
      return {
        ...state,
        pendingService: action.payload,
      };

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
    }): void;

    addService(params: {
      serviceId: string;
      staffId: string | "ANY";
      durationMin: number;
    }): void;

    removeLastService(): void;
    setStaffForService(index: number, staffId: string | "ANY"): void;

    setStep(step: SlotBookingState["step"]): void;
    nextStep(): void;
    prevStep(): void;

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

      setStaffForService: (index, staffId) =>
        dispatch({
          type: "SET_STAFF_FOR_SERVICE",
          payload: { index, staffId },
        }),

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
