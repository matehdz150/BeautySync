"use client";

import { AvailabilityChainPlan } from "@/lib/services/public/availability";
import { createContext, useContext, useReducer, ReactNode } from "react";

/* =====================
   TYPES
===================== */

type AssignmentMode = "ANY" | "BY_SERVICE";

export type Branch = {
  id: string;
  name: string;
  slug: string;
  address: string;
  images?: any[];
  services?: any[];
  lat?: string;
  lng?: string;
  description? :string;
};

export type PublicService = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number | null;
  category: {
    id: string;
    name: string;
    icon: string;
    hexColor: string;
  };
};

type BookingState = {
  branch: Branch | null;
  step: number;

  services: string[]; // ids de servicios seleccionados
  staffByService: Record<string, string>;
  assignmentMode: AssignmentMode;

  date: string | null;
  time: string | null;

  loading: boolean;
  error: string | null;

  catalog: PublicService[];

  canContinue: boolean;

  staffCatalog: { id: string; name: string; avatarUrl?: string }[];

  selectedPlan: AvailabilityChainPlan | null;
  appointmentsDraft: {
    serviceId: string;
    staffId: string;
    startIso: string;
    endIso: string;
    durationMin: number;
  }[];
};

type BookingAction =
  | { type: "START_LOADING" }
  | { type: "SET_BRANCH"; payload: Branch }
  | { type: "SET_ERROR"; payload: string }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "SET_STEP"; payload: number }
  | { type: "TOGGLE_SERVICE"; payload: string }
  | {
      type: "SET_STAFF_FOR_SERVICE";
      payload: { serviceId: string; staffId: string };
    }
  | { type: "SET_DATE"; payload: string }
  | { type: "SET_TIME"; payload: string }
  | { type: "SET_CATALOG"; payload: PublicService[] }
  | { type: "SET_ASSIGNMENT_MODE"; payload: AssignmentMode }
  | { type: "SET_TIME"; payload: string }
  | { type: "SET_SELECTED_PLAN"; payload: AvailabilityChainPlan | null }
  | {
      type: "SET_APPOINTMENTS_DRAFT";
      payload: BookingState["appointmentsDraft"];
    }
  | {
      type: "SET_STAFF_CATALOG";
      payload: { id: string; name: string; avatarUrl?: string }[];
    }
  | { type: "RESET_BOOKING" };

/* =====================
   INITIAL STATE
===================== */

const initialState: BookingState = {
  branch: null,
  step: 1,

  services: [],
  staffByService: {},
  assignmentMode: "ANY",

  date: null,
  time: null,

  loading: false,
  error: null,

  catalog: [],
  staffCatalog: [],

  canContinue: false,
  selectedPlan: null,
  appointmentsDraft: [],
};

/* =====================
   REDUCER
===================== */

function computeCanContinue(state: BookingState): boolean {
  switch (state.step) {
    case 1:
      // Servicios seleccionados
      return state.services.length > 0;

    case 2:
      if (state.assignmentMode === "ANY") return true;

      if (state.assignmentMode === "BY_SERVICE")
        return state.services.every(
          (id) => !!state.staffByService[id] // "ANY" o staffId
        );

      return false;

    case 3:
      return (
        !!state.date &&
        !!state.selectedPlan &&
        state.appointmentsDraft.length > 0
      );

    case 4:
      return true;

    default:
      return false;
  }
}

function bookingReducer(
  state: BookingState,
  action: BookingAction
): BookingState {
  let nextState: BookingState;

  switch (action.type) {
    case "START_LOADING":
      nextState = {
        ...state,
        loading: true,
        error: null,
      };
      break;

    case "SET_BRANCH":
      nextState = {
        ...state,
        branch: action.payload,
        loading: false,
        error: null,
      };
      break;

    case "SET_ERROR":
      nextState = {
        ...state,
        error: action.payload,
        loading: false,
      };
      break;

    case "SET_STEP":
      nextState = {
        ...state,
        step: action.payload,
      };
      break;

    case "NEXT_STEP":
      nextState = {
        ...state,
        step: Math.min(state.step + 1, 4),
      };
      break;

    case "PREV_STEP":
      nextState = {
        ...state,
        step: Math.max(state.step - 1, 1),
      };
      break;

    case "TOGGLE_SERVICE": {
      const exists = state.services.includes(action.payload);

      if (exists) {
        const { [action.payload]: _, ...restStaff } = state.staffByService;

        nextState = {
          ...state,
          services: state.services.filter((id) => id !== action.payload),
          staffByService: restStaff,
        };
      } else {
        nextState = {
          ...state,
          services: [...state.services, action.payload],
        };
      }
      break;
    }

    case "SET_STAFF_FOR_SERVICE":
      nextState = {
        ...state,
        staffByService: {
          ...state.staffByService,
          [action.payload.serviceId]: action.payload.staffId,
        },
      };
      break;

    case "SET_DATE":
      nextState = {
        ...state,
        date: action.payload,
        time: null,
        selectedPlan: null,
        appointmentsDraft: [],
      };
      break;

    case "SET_TIME":
      nextState = {
        ...state,
        time: action.payload,
      };
      break;

    case "SET_CATALOG":
      nextState = {
        ...state,
        catalog: action.payload,
        loading: false,
        error: null,
      };
      break;

    case "SET_ASSIGNMENT_MODE":
      nextState = {
        ...state,
        assignmentMode: action.payload,
        staffByService: {}, // 👈 resetea si cambian de modo
      };
      break;

    case "RESET_BOOKING":
      nextState = initialState;
      break;

    case "SET_SELECTED_PLAN":
      nextState = { ...state, selectedPlan: action.payload };
      break;

    case "SET_APPOINTMENTS_DRAFT":
      nextState = { ...state, appointmentsDraft: action.payload };
      break;

    case "SET_STAFF_CATALOG":
      nextState = {
        ...state,
        staffCatalog: action.payload,
      };
      break;

    default:
      nextState = state;
  }

  // ✅ AQUÍ se recalcula SIEMPRE
  return {
    ...nextState,
    canContinue: computeCanContinue(nextState),
  };
}

/* =====================
   CONTEXT
===================== */

type BookingContextType = BookingState & {
  dispatch: React.Dispatch<BookingAction>;
};

const PublicBookingContext = createContext<BookingContextType | null>(null);

/* =====================
   PROVIDER
===================== */

export function PublicBookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  return (
    <PublicBookingContext.Provider
      value={{
        ...state,
        dispatch,
      }}
    >
      {children}
    </PublicBookingContext.Provider>
  );
}

/* =====================
   HOOK
===================== */

export function usePublicBooking() {
  const ctx = useContext(PublicBookingContext);

  if (!ctx) {
    throw new Error(
      "usePublicBooking must be used inside PublicBookingProvider"
    );
  }

  return ctx;
}
