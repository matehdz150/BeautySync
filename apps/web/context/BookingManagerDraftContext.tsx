// src/context/BookingManagerDraftContext.tsx
"use client";

import React, { createContext, useContext, useMemo, useReducer } from "react";

export type DraftService = {
  id: string;
  name: string;
  durationMin: number;
  priceCents?: number | null;
  category?: { id: string; name: string; colorHex?: string | null } | null;
};

export type StaffChoiceMode = "ANY" | "SINGLE_STAFF" | "PER_SERVICE";

export type ChainDraftInput = {
  date: string; // YYYY-MM-DD
  chain: { serviceId: string; staffId: string | "ANY" }[];
};

export type ChainAssignment = {
  serviceId: string;
  staffId: string;
  startIso: string; // UTC ISO
  endIso: string;   // UTC ISO
  startLocalIso: string; // local ISO
  endLocalIso: string;   // local ISO
  durationMin: number;
};

export type ChainPlan = {
  startIso: string; // UTC ISO
  startLocalIso: string;
  startLocalLabel: string; // "08:00"
  assignments: ChainAssignment[];
};

export type BookingManagerDraftState = {
  branchId: string | null;

  // Step 1
  services: DraftService[];

  // Step 2
  staffChoiceMode: StaffChoiceMode;
  singleStaffId: string | null; // para SINGLE_STAFF
  staffByService: Record<string, string | "ANY">; // PER_SERVICE

  // Step 3
  date: string | null; // YYYY-MM-DD
  plans: ChainPlan[];
  selectedPlanStartIso: string | null;

  // Step 4 extra
  clientId: string | null; // opcional
  notes: string | null;
  paymentMethod: "ONSITE" | "ONLINE";
};

const initialState: BookingManagerDraftState = {
  branchId: null,

  services: [],

  staffChoiceMode: "ANY",
  singleStaffId: null,
  staffByService: {},

  date: null,
  plans: [],
  selectedPlanStartIso: null,

  clientId: null,
  notes: null,
  paymentMethod: "ONSITE",
};

type Action =
  | { type: "RESET" }
  | { type: "SET_BRANCH"; branchId: string }
  | { type: "SET_SERVICES"; services: DraftService[] }
  | { type: "TOGGLE_SERVICE"; service: DraftService }
  | { type: "REMOVE_SERVICE"; serviceId: string }
  | { type: "SET_STAFF_MODE"; mode: StaffChoiceMode }
  | { type: "SET_SINGLE_STAFF"; staffId: string | null }
  | { type: "SET_STAFF_FOR_SERVICE"; serviceId: string; staffId: string | "ANY" }
  | { type: "SET_DATE"; date: string | null }
  | { type: "SET_PLANS"; plans: ChainPlan[] }
  | { type: "SELECT_PLAN"; startIso: string | null }
  | { type: "SET_CLIENT"; clientId: string | null }
  | { type: "SET_NOTES"; notes: string | null }
  | { type: "SET_PAYMENT_METHOD"; paymentMethod: "ONSITE" | "ONLINE" };

function reducer(state: BookingManagerDraftState, action: Action): BookingManagerDraftState {
  switch (action.type) {
    case "RESET":
      return { ...initialState, branchId: state.branchId }; // conserva branchId si ya estaba
    case "SET_BRANCH":
      return { ...state, branchId: action.branchId };

    case "SET_SERVICES": {
      const next = { ...state, services: action.services };
      // limpiar staffByService de servicios removidos
      const ids = new Set(action.services.map((s) => s.id));
      const staffByService: Record<string, string | "ANY"> = {};
      for (const [k, v] of Object.entries(state.staffByService)) {
        if (ids.has(k)) staffByService[k] = v;
      }
      return {
        ...next,
        staffByService,
        plans: [],
        selectedPlanStartIso: null,
      };
    }

    case "TOGGLE_SERVICE": {
      const exists = state.services.some((s) => s.id === action.service.id);
      const services = exists
        ? state.services.filter((s) => s.id !== action.service.id)
        : [...state.services, action.service];

      // si quitaste un servicio, limpiar su staff assignment
      const staffByService = { ...state.staffByService };
      if (exists) delete staffByService[action.service.id];

      return {
        ...state,
        services,
        staffByService,
        plans: [],
        selectedPlanStartIso: null,
      };
    }

    case "REMOVE_SERVICE": {
      const services = state.services.filter((s) => s.id !== action.serviceId);
      const staffByService = { ...state.staffByService };
      delete staffByService[action.serviceId];
      return {
        ...state,
        services,
        staffByService,
        plans: [],
        selectedPlanStartIso: null,
      };
    }

    case "SET_STAFF_MODE":
      return {
        ...state,
        staffChoiceMode: action.mode,
        // al cambiar modo, limpiamos selección de plan porque cambia asignación
        plans: [],
        selectedPlanStartIso: null,
      };

    case "SET_SINGLE_STAFF":
      return {
        ...state,
        singleStaffId: action.staffId,
        plans: [],
        selectedPlanStartIso: null,
      };

    case "SET_STAFF_FOR_SERVICE":
      return {
        ...state,
        staffByService: { ...state.staffByService, [action.serviceId]: action.staffId },
        plans: [],
        selectedPlanStartIso: null,
      };

    case "SET_DATE":
      return {
        ...state,
        date: action.date,
        plans: [],
        selectedPlanStartIso: null,
      };

    case "SET_PLANS":
      return { ...state, plans: action.plans };

    case "SELECT_PLAN":
      return { ...state, selectedPlanStartIso: action.startIso };

    case "SET_CLIENT":
      return { ...state, clientId: action.clientId };

    case "SET_NOTES":
      return { ...state, notes: action.notes };

    case "SET_PAYMENT_METHOD":
      return { ...state, paymentMethod: action.paymentMethod };

    default:
      return state;
  }
}

type Ctx = {
  state: BookingManagerDraftState;
  actions: {
    reset(): void;
    setBranchId(branchId: string): void;

    setServices(services: DraftService[]): void;
    toggleService(service: DraftService): void;
    removeService(serviceId: string): void;

    setStaffChoiceMode(mode: StaffChoiceMode): void;
    setSingleStaffId(staffId: string | null): void;
    setStaffForService(serviceId: string, staffId: string | "ANY"): void;

    setDate(date: string | null): void;
    setPlans(plans: ChainPlan[]): void;
    selectPlan(startIso: string | null): void;

    setClientId(clientId: string | null): void;
    setNotes(notes: string | null): void;
    setPaymentMethod(method: "ONSITE" | "ONLINE"): void;

    buildChainDraftPayload(): ChainDraftInput;
    getSelectedPlan(): ChainPlan | null;
    isStep2Valid(): boolean;
    isStep3Ready(): boolean; // staff valid
  };
};

const BookingManagerDraftContext = createContext<Ctx | null>(null);

export function BookingManagerDraftProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions: Ctx["actions"] = useMemo(() => {
    return {
      reset: () => dispatch({ type: "RESET" }),
      setBranchId: (branchId) => dispatch({ type: "SET_BRANCH", branchId }),

      setServices: (services) => dispatch({ type: "SET_SERVICES", services }),
      toggleService: (service) => dispatch({ type: "TOGGLE_SERVICE", service }),
      removeService: (serviceId) => dispatch({ type: "REMOVE_SERVICE", serviceId }),

      setStaffChoiceMode: (mode) => dispatch({ type: "SET_STAFF_MODE", mode }),
      setSingleStaffId: (staffId) => dispatch({ type: "SET_SINGLE_STAFF", staffId }),
      setStaffForService: (serviceId, staffId) =>
        dispatch({ type: "SET_STAFF_FOR_SERVICE", serviceId, staffId }),

      setDate: (date) => dispatch({ type: "SET_DATE", date }),
      setPlans: (plans) => dispatch({ type: "SET_PLANS", plans }),
      selectPlan: (startIso) => dispatch({ type: "SELECT_PLAN", startIso }),

      setClientId: (clientId) => dispatch({ type: "SET_CLIENT", clientId }),
      setNotes: (notes) => dispatch({ type: "SET_NOTES", notes }),
      setPaymentMethod: (paymentMethod) => dispatch({ type: "SET_PAYMENT_METHOD", paymentMethod }),

      isStep2Valid: () => state.services.length >= 1,

      isStep3Ready: () => {
        if (!state.services.length) return false;

        if (state.staffChoiceMode === "ANY") return true;

        if (state.staffChoiceMode === "SINGLE_STAFF") {
          return !!state.singleStaffId;
        }

        // PER_SERVICE
        return state.services.every((s) => {
          const v = state.staffByService[s.id];
          return typeof v === "string" && v.length > 0; // "ANY" también cuenta (string)
        });
      },

      buildChainDraftPayload: () => {
        if (!state.date) throw new Error("Missing date");
        if (!state.services.length) throw new Error("Missing services");

        const chain = state.services.map((s) => {
          if (state.staffChoiceMode === "ANY") {
            return { serviceId: s.id, staffId: "ANY" as const };
          }
          if (state.staffChoiceMode === "SINGLE_STAFF") {
            if (!state.singleStaffId) throw new Error("Missing singleStaffId");
            return { serviceId: s.id, staffId: state.singleStaffId };
          }
          // PER_SERVICE
          const staffId = state.staffByService[s.id];
          if (!staffId) throw new Error(`Missing staff for service ${s.id}`);
          return { serviceId: s.id, staffId };
        });

        return { date: state.date, chain };
      },

      getSelectedPlan: () => {
        if (!state.selectedPlanStartIso) return null;
        return state.plans.find((p) => p.startIso === state.selectedPlanStartIso) ?? null;
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <BookingManagerDraftContext.Provider value={value}>{children}</BookingManagerDraftContext.Provider>;
}

export function useBookingManagerDraft() {
  const ctx = useContext(BookingManagerDraftContext);
  if (!ctx) throw new Error("useBookingManagerDraft must be used inside BookingManagerDraftProvider");
  return ctx;
}