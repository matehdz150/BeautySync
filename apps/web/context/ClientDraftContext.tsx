"use client";

import { createContext, useReducer, ReactNode, useContext } from "react";

/* =============================
   PROFILE TYPE
============================= */

export type ClientProfileDraft = {
  gender?: string | null;
  occupation?: string | null;
  city?: string | null;
};

export type ClientEditable = {
  name: boolean
  email: boolean
  phone: boolean
}

export type ClientDraft = {
  id?: string;
  organizationId?: string;
  original?: ClientDraft;

  name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;

  birthdate?: string | null;

  profile?: ClientProfileDraft;

  editable?: ClientEditable
  
};

export const initialClientDraft: ClientDraft = {
  name: "",
  email: "",
  phone: "",
  avatarUrl: null,
  birthdate: null,

  profile: {
    gender: null,
    occupation: null,
    city: null,
  },
};

/* =============================
   ACTIONS
============================= */

type Action =
  | { type: "SET_NAME"; value: string }
  | { type: "SET_EMAIL"; value?: string }
  | { type: "SET_PHONE"; value?: string }
  | { type: "SET_AVATAR"; value?: string | null }
  | { type: "SET_BIRTHDATE"; value?: string }
  | { type: "SET_GENDER"; value?: string }
  | { type: "SET_OCCUPATION"; value?: string }
  | { type: "SET_CITY"; value?: string }
  | { type: "LOAD_EXISTING"; value: ClientDraft }
  | {
      type: "SYNC_ORG";
      organizationId?: string;
    }
  | { type: "RESET" };

/* =============================
   REDUCER
============================= */

function reducer(state: ClientDraft, action: Action): ClientDraft {
  switch (action.type) {
    case "SYNC_ORG":
      return {
        ...state,
        organizationId: action.organizationId,
      };

    case "SET_NAME":
      return { ...state, name: action.value };

    case "SET_EMAIL":
      return { ...state, email: action.value ?? null };

    case "SET_PHONE":
      return { ...state, phone: action.value ?? null };

    case "SET_AVATAR":
      return { ...state, avatarUrl: action.value ?? null };

    case "SET_BIRTHDATE":
      return { ...state, birthdate: action.value ?? null };

    case "SET_GENDER":
      return {
        ...state,
        profile: {
          ...state.profile,
          gender: action.value ?? null,
        },
      };

    case "SET_OCCUPATION":
      return {
        ...state,
        profile: {
          ...state.profile,
          occupation: action.value ?? null,
        },
      };

    case "SET_CITY":
      return {
        ...state,
        profile: {
          ...state.profile,
          city: action.value ?? null,
        },
      };

    case "LOAD_EXISTING":
      return {
        ...state,
        ...action.value,
        original: action.value,
      };

    case "RESET":
      return initialClientDraft;

    default:
      return state;
  }
}

/* =============================
   CONTEXT
============================= */

const ClientDraftContext = createContext<{
  state: ClientDraft;
  dispatch: React.Dispatch<Action>;
  isValid: boolean;
} | null>(null);

/* =============================
   PROVIDER
============================= */

export function ClientDraftProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialClientDraft);

  const isValid =
    !!state.organizationId && !!state.name && state.name.trim().length > 0;

  return (
    <ClientDraftContext.Provider
      value={{
        state,
        dispatch,
        isValid,
      }}
    >
      {children}
    </ClientDraftContext.Provider>
  );
}

/* =============================
   HOOK
============================= */

export function useClientDraft() {
  const ctx = useContext(ClientDraftContext);

  if (!ctx) {
    throw new Error("useClientDraft must be used inside provider");
  }

  return ctx;
}
