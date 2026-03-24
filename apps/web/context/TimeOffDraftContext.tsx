"use client";

import { createContext, useContext, useEffect, useReducer } from "react";
import { DateTime } from "luxon";
import { useBranch } from "./BranchContext";

type RecurrenceType = "NONE" | "DAILY" | "WEEKLY";

export type TimeOffDraft = {
  staffId: string;

  branchId: string;

  mode: "SINGLE" | "RECURRING";

  date: string;
  startTime: string;
  endTime: string;

  recurrenceType: RecurrenceType;
  daysOfWeek: number[];
  startDate: string;
  endDate: string;

  reason: string;
};

type Action =
  | { type: "INIT"; payload?: { startISO?: string } }
  | { type: "SET_STAFF"; staffId: string }
  | {
      type: "SET_FIELD";
      field: keyof TimeOffDraft;
      value: TimeOffDraft[keyof TimeOffDraft];
    }
  | { type: "TOGGLE_DAY"; day: number }
  | { type: "SET_MODE"; mode: "SINGLE" | "RECURRING" };

function createInitialState(): TimeOffDraft {
  const now = DateTime.now();

  return {
    staffId: "",
    branchId: "",

    mode: "SINGLE",

    date: now.toISODate()!,
    startTime: now.toFormat("HH:mm"),
    endTime: now.plus({ hours: 1 }).toFormat("HH:mm"),

    recurrenceType: "WEEKLY",
    daysOfWeek: [now.weekday === 7 ? 0 : now.weekday],
    startDate: now.toISODate()!,
    endDate: now.plus({ months: 1 }).toISODate()!,

    reason: "",
  };
}

function reducer(state: TimeOffDraft, action: Action): TimeOffDraft {
  switch (action.type) {
    case "INIT": {
      const now = action.payload?.startISO
        ? DateTime.fromISO(action.payload.startISO)
        : DateTime.now();

      return {
        ...createInitialState(),
        date: now.toISODate()!,
        startTime: now.toFormat("HH:mm"),
        endTime: now.plus({ hours: 1 }).toFormat("HH:mm"),
        daysOfWeek: [now.weekday === 7 ? 0 : now.weekday],
      };
    }

    case "SET_STAFF":
      return {
        ...state,
        staffId: action.staffId,
      };

    case "SET_FIELD":
      return {
        ...state,
        [action.field]: action.value,
      };

    case "TOGGLE_DAY":
      return {
        ...state,
        daysOfWeek: state.daysOfWeek.includes(action.day)
          ? state.daysOfWeek.filter((d) => d !== action.day)
          : [...state.daysOfWeek, action.day],
      };

    case "SET_MODE":
      return {
        ...state,
        mode: action.mode,
      };

    default:
      return state;
  }
}

/* =========================
   CONTEXT
========================= */

const Context = createContext<{
  state: TimeOffDraft;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function TimeOffDraftProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const { branch } = useBranch();

  useEffect(() => {
    if (branch?.id) {
      dispatch({
        type: "SET_FIELD",
        field: "branchId",
        value: branch.id,
      });
    }
  }, [branch?.id]);

  return (
    <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>
  );
}

/* =========================
   HOOK BASE
========================= */

export function useTimeOffDraft() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useTimeOffDraft must be used inside provider");
  return ctx;
}

/* =========================
   ACTIONS (HIGH LEVEL API)
========================= */

export function useTimeOffActions() {
  const { dispatch } = useTimeOffDraft();

  return {
    setStaff: (staffId: string) => dispatch({ type: "SET_STAFF", staffId }),

    setField: <K extends keyof TimeOffDraft>(
      field: K,
      value: TimeOffDraft[K],
    ) => dispatch({ type: "SET_FIELD", field, value }),

    toggleDay: (day: number) => dispatch({ type: "TOGGLE_DAY", day }),

    setMode: (mode: "SINGLE" | "RECURRING") =>
      dispatch({ type: "SET_MODE", mode }),

    init: (startISO?: string) =>
      dispatch({ type: "INIT", payload: { startISO } }),
  };
}
