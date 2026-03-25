"use client";

import { createContext, useContext, useEffect, useReducer } from "react";
import { DateTime } from "luxon";
import { useBranch } from "./BranchContext";

type RecurrenceType = "NONE" | "DAILY" | "WEEKLY";

export type TimeOffDraft = {
  isEdit: boolean;
  timeOffId?: number;
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
  | { type: "RESET" }
  | { type: "LOAD_FROM_TIMEOFF"; payload: any }
  | { type: "TOGGLE_DAY"; day: number }
  | { type: "SET_MODE"; mode: "SINGLE" | "RECURRING" };

function createInitialState(): TimeOffDraft {
  const now = DateTime.now();

  return {
    staffId: "",
    branchId: "",
    isEdit: false,

    mode: "SINGLE",

    date: now.toISODate()!,
    startTime: "",
    endTime: "",

    recurrenceType: "NONE",
    daysOfWeek: [now.weekday === 7 ? 0 : now.weekday],
    startDate: now.toISODate()!,
    endDate: now.plus({ months: 1 }).toISODate()!,

    reason: "",
  };
}

function reducer(state: TimeOffDraft, action: Action): TimeOffDraft {
  switch (action.type) {
    case "INIT": {
      if (state.isEdit) return state;
      const now = action.payload?.startISO
        ? DateTime.fromISO(action.payload.startISO)
        : DateTime.now();

      return {
        ...createInitialState(),
        date: now.toISODate()!,
        startTime: "",
        endTime: "",
        daysOfWeek: [now.weekday === 7 ? 0 : now.weekday],
      };
    }

    case "RESET":
      return createInitialState();

    case "SET_STAFF":
      return {
        ...state,
        staffId: action.staffId,
        startTime: "",
        endTime: "",
      };

    case "SET_FIELD": {
      const newState = {
        ...state,
        [action.field]: action.value,
      };

      // 🔥 reset al cambiar fecha
      if (action.field === "date") {
        newState.startTime = "";
        newState.endTime = "";
      }

      // 🔥 reset al cambiar tipo de recurrencia
      if (action.field === "recurrenceType") {
        newState.startTime = "";
        newState.endTime = "";
      }

      return newState;
    }

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

    case "LOAD_FROM_TIMEOFF": {
      const data = action.payload;

      console.log(data, 'desde el contexto')

      const start = DateTime.fromISO(data.timeOff.start, {
        zone: "utc",
      }).setZone("America/Mexico_City");

      const end = DateTime.fromISO(data.timeOff.end, { zone: "utc" }).setZone(
        "America/Mexico_City",
      );

      const rule = data.rules?.[0];

      return {
        ...state,

        isEdit: true,
        timeOffId: data.timeOff.id,

        staffId: data.timeOff.staffId,

        date: start.toISODate()!,
        startTime: start.toFormat("HH:mm"),
        endTime: end.toFormat("HH:mm"),

        recurrenceType: rule?.recurrenceType ?? "NONE",
        daysOfWeek: rule?.daysOfWeek ?? [],

        startDate: rule?.startDate
          ? DateTime.fromISO(rule.startDate, { zone: "utc" })
              .setZone("America/Mexico_City")
              .toISODate()!
          : start.toISODate()!,

        endDate: rule?.endDate
          ? DateTime.fromISO(rule.endDate, { zone: "utc" })
              .setZone("America/Mexico_City")
              .toISODate()!
          : "",

        reason: data.timeOff.reason ?? "",
      };
    }

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
    if (!branch?.id) return;

    dispatch({
      type: "SET_FIELD",
      field: "branchId",
      value: branch.id,
    });
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

    loadFromTimeOff: (data: any) =>
      dispatch({ type: "LOAD_FROM_TIMEOFF", payload: data }),

    init: (startISO?: string) =>
      dispatch({ type: "INIT", payload: { startISO } }),

    reset: () => dispatch({ type: "RESET" }),
  };
}
