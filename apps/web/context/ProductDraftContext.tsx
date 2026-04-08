"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import { useBranch } from "@/context/BranchContext";

export type ProductDraft = {
  id?: string;
  branchId?: string;
  name: string;
  description?: string | null;
  priceCents?: number | null;
  imageUrl?: string | null;
  isActive?: boolean;
};

const initialProductDraft: ProductDraft = {
  name: "",
  description: "",
  priceCents: null,
  imageUrl: "",
  isActive: true,
};

type Action =
  | { type: "SYNC_BRANCH"; branchId?: string }
  | { type: "SET_NAME"; value: string }
  | { type: "SET_DESCRIPTION"; value?: string | null }
  | { type: "SET_PRICE"; value?: number | null }
  | { type: "SET_IMAGE_URL"; value?: string | null }
  | { type: "LOAD_EXISTING"; value: ProductDraft }
  | { type: "RESET" };

function reducer(state: ProductDraft, action: Action): ProductDraft {
  switch (action.type) {
    case "SYNC_BRANCH":
      return { ...state, branchId: action.branchId };
    case "SET_NAME":
      return { ...state, name: action.value };
    case "SET_DESCRIPTION":
      return { ...state, description: action.value ?? "" };
    case "SET_PRICE":
      return { ...state, priceCents: action.value ?? null };
    case "SET_IMAGE_URL":
      return { ...state, imageUrl: action.value ?? "" };
    case "LOAD_EXISTING":
      return { ...state, ...action.value };
    case "RESET":
      return initialProductDraft;
    default:
      return state;
  }
}

const ProductDraftContext = createContext<{
  state: ProductDraft;
  dispatch: React.Dispatch<Action>;
  isValid: boolean;
  validateAndFocus: () => boolean;
} | null>(null);

export function ProductDraftProvider({ children }: { children: ReactNode }) {
  const { branch } = useBranch();
  const [state, dispatch] = useReducer(reducer, initialProductDraft);

  useEffect(() => {
    dispatch({ type: "SYNC_BRANCH", branchId: branch?.id });
  }, [branch?.id]);

  const isValid =
    !!state.branchId &&
    state.name.trim().length > 0 &&
    typeof state.priceCents === "number" &&
    state.priceCents >= 0;

  function validateAndFocus() {
    if (!state.name.trim()) {
      document.getElementById("product-name")?.focus();
      return false;
    }

    if (
      state.priceCents === null ||
      typeof state.priceCents !== "number" ||
      Number.isNaN(state.priceCents) ||
      state.priceCents < 0
    ) {
      const priceEl = document.getElementById("product-price");
      setTimeout(() => {
        priceEl?.scrollIntoView({ behavior: "smooth", block: "center" });
        (priceEl as HTMLInputElement | null)?.focus();
      }, 0);
      return false;
    }

    return true;
  }

  return (
    <ProductDraftContext.Provider
      value={{ state, dispatch, isValid, validateAndFocus }}
    >
      {children}
    </ProductDraftContext.Provider>
  );
}

export function useProductDraft() {
  const ctx = useContext(ProductDraftContext);
  if (!ctx) {
    throw new Error("useProductDraft must be used inside ProductDraftProvider");
  }
  return ctx;
}
