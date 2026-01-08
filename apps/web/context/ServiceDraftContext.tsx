"use client";

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
  useState,
} from "react";

import { useBranch } from "@/context/BranchContext";

/* =========================
   TYPES
========================= */

export type ServiceDraft = {
  id?: string;
  organizationId?: string;
  branchId?: string;

  categoryId?: string | null;

  name: string;
  description?: string | null;

  durationMin?: number;
  priceCents?: number | null;

  staffIds: string[];
  originalStaffIds?: string[];

  notes: string[];
  serviceRules: string[];

  isActive: boolean;
};

export const initialServiceDraft: ServiceDraft = {
  name: "",
  description: "",
  categoryId: null,

  durationMin: undefined,
  priceCents: null,

  notes: [],
  serviceRules: [],
  staffIds: [],
  originalStaffIds: [],

  isActive: true,
};

/* =========================
   ACTIONS
========================= */

type Action =
  | { type: "SET_NAME"; value: string }
  | { type: "SET_DESCRIPTION"; value?: string }
  | { type: "SET_CATEGORY"; value?: string | null }
  | { type: "SET_DURATION"; value: number }
  | { type: "SET_PRICE"; value?: number | null }
  | { type: "ADD_NOTE"; value: string }
  | { type: "REMOVE_NOTE"; index: number }
  | { type: "ADD_RULE"; value: string }
  | { type: "REMOVE_RULE"; index: number }
  | { type: "SET_ACTIVE"; value: boolean }
  | { type: "SET_STAFF"; value: string[] }
  //Edicion
  | { type: "LOAD_EXISTING"; value: ServiceDraft }
  | {
      type: "SYNC_BRANCH";
      organizationId?: string;
      branchId?: string;
    }
  | { type: "RESET" };

/* =========================
   REDUCER
========================= */

function reducer(state: ServiceDraft, action: Action): ServiceDraft {
  switch (action.type) {
    case "SYNC_BRANCH":
      return {
        ...state,
        organizationId: action.organizationId,
        branchId: action.branchId,
      };

    case "SET_NAME":
      return { ...state, name: action.value };

    case "SET_DESCRIPTION":
      return { ...state, description: action.value ?? null };

    case "SET_CATEGORY":
      return { ...state, categoryId: action.value ?? null };

    case "SET_STAFF":
      return { ...state, staffIds: action.value };

    case "SET_DURATION":
      return { ...state, durationMin: action.value };

    case "SET_PRICE":
      return { ...state, priceCents: action.value ?? null };

    case "ADD_NOTE":
      return { ...state, notes: [...state.notes, action.value] };

    case "REMOVE_NOTE":
      return {
        ...state,
        notes: state.notes.filter((_, i) => i !== action.index),
      };

    case "ADD_RULE":
      return { ...state, serviceRules: [...state.serviceRules, action.value] };

    case "REMOVE_RULE":
      return {
        ...state,
        serviceRules: state.serviceRules.filter((_, i) => i !== action.index),
      };

    case "SET_ACTIVE":
      return { ...state, isActive: action.value };

    //edicion

    case "LOAD_EXISTING":
      return {
        ...state,
        ...action.value,
        staffIds: action.value.staffIds ?? [],
        originalStaffIds: action.value.staffIds ?? [], // 👈 guardamos snapshot
      };

    case "RESET":
      return initialServiceDraft;

    default:
      return state;
  }
}

/* =========================
   CONTEXT
========================= */

const ServiceDraftContext = createContext<{
  state: ServiceDraft;
  dispatch: React.Dispatch<Action>;
  isValid: boolean;
  validateAndFocus: (opts?: { onCategoryError?: () => void }) => boolean;
  openCategoryPicker: boolean;
  setOpenCategoryPicker: (v: boolean) => void;
  openDurationPicker: boolean;
  setOpenDurationPicker: (v: boolean) => void;
} | null>(null);

/* =========================
   PROVIDER
========================= */

export function ServiceDraftProvider({ children }: { children: ReactNode }) {
  const { branch } = useBranch();

  const [state, dispatch] = useReducer(reducer, initialServiceDraft);
  const [openCategoryPicker, setOpenCategoryPicker] = useState(false);
  const [openDurationPicker, setOpenDurationPicker] = useState(false);

  // 🔥 sincronizar branch → draft
  useEffect(() => {
    dispatch({
      type: "SYNC_BRANCH",
      organizationId: branch?.organizationId,
      branchId: branch?.id,
    });
  }, [branch]);

  const isValid =
    !!state.organizationId &&
    !!state.branchId &&
    !!state.categoryId &&
    state.name.trim().length > 0 &&
    typeof state.durationMin === "number" &&
    state.durationMin > 0 &&
    typeof state.priceCents === "number" &&
    state.priceCents >= 0;

  function validateAndFocus() {
    if (!state.name.trim()) {
      document.getElementById("service-name")?.focus();
      return false;
    }

    if (
      state.priceCents === null ||
      typeof state.priceCents !== "number" ||
      Number.isNaN(state.priceCents) ||
      state.priceCents <= 0
    ) {
      const priceEl = document.getElementById("service-price");

      setTimeout(() => {
        priceEl?.scrollIntoView({ behavior: "smooth", block: "center" });
        (priceEl as HTMLInputElement)?.focus();
      }, 0);

      return false;
    }

    if (!state.categoryId) {
      document
        .getElementById("service-category")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });

      setOpenCategoryPicker(true); // 👈🔥 AHORA SÍ

      return false;
    }

    if (!state.durationMin) {
      document
        .getElementById("service-duration")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });

      setOpenDurationPicker(true); // 👈🔥 ABRIR

      return false;
    }

    return true;
  }

  return (
    <ServiceDraftContext.Provider
      value={{
        state,
        dispatch,
        isValid,
        validateAndFocus,
        openCategoryPicker,
        setOpenCategoryPicker,
        openDurationPicker,
        setOpenDurationPicker,
      }}
    >
      {children}
    </ServiceDraftContext.Provider>
  );
}

/* =========================
   HOOK
========================= */

export function useServiceDraft() {
  const ctx = useContext(ServiceDraftContext);
  if (!ctx) throw new Error("useServiceDraft must be used inside provider");
  return ctx;
}
