"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from "react";
import { DateTime } from "luxon";
import { useBranch } from "@/context/BranchContext";
import { getAppointmentsByDay } from "@/lib/services/appointments";
import { getStaffByBranch } from "@/lib/services/staff";
import { getScheduleForStaff } from "@/lib/services/staffSchedules";
import { getConceptualStatus } from "@/lib/helpers/conceptualStatus";

/* ---------- TYPES ---------- */

type Prefill = {
  defaultStaffId?: string;
  startISO?: string;
};

type CalendarState = {
  date: string;

  staff: any[];
  schedules: Record<string, any[]>;
  appointments: any[];
  dailyCounts: Record<string, number>;

  dialogOpen: boolean;
  prefill: Prefill;

  selectedEvent: any | null;
  anchorRect: DOMRect | null;
};

type Action =
  | { type: "SET_DATE"; payload: string }
  | { type: "SET_STAFF"; payload: any[] }
  | { type: "SET_SCHEDULES"; payload: Record<string, any[]> }
  | { type: "SET_APPOINTMENTS"; payload: any[] }
  | { type: "SET_DAILY_COUNTS"; payload: Record<string, number> }

  | { type: "OPEN_SHEET"; payload?: Prefill }
  | { type: "CLOSE_SHEET" }

  | { type: "SELECT_EVENT"; payload: { event: any; rect: DOMRect } }
  | { type: "CLEAR_EVENT" };

/* ---------- INITIAL STATE ---------- */

const initialState: CalendarState = {
  date: DateTime.now().toISODate(),

  staff: [],
  schedules: {},
  appointments: [],
  dailyCounts: {},

  dialogOpen: false,
  prefill: {},

  selectedEvent: null,
  anchorRect: null,
};

/* ---------- REDUCER ---------- */

function calendarReducer(
  state: CalendarState,
  action: Action
): CalendarState {
  switch (action.type) {
    case "SET_DATE":
      return { ...state, date: action.payload };

    case "SET_STAFF":
      return { ...state, staff: action.payload };

    case "SET_SCHEDULES":
      return { ...state, schedules: action.payload };

    case "SET_APPOINTMENTS":
      return { ...state, appointments: action.payload };

    case "SET_DAILY_COUNTS":
      return { ...state, dailyCounts: action.payload };

    case "OPEN_SHEET":
      return { ...state, dialogOpen: true, prefill: action.payload ?? {} };

    case "CLOSE_SHEET":
      return { ...state, dialogOpen: false, prefill: {} };

    case "SELECT_EVENT":
      return {
        ...state,
        selectedEvent: action.payload.event,
        anchorRect: action.payload.rect,
      };

    case "CLEAR_EVENT":
      return { ...state, selectedEvent: null, anchorRect: null };

    default:
      return state;
  }
}

/* ---------- CONTEXT ---------- */

const CalendarContext = createContext<any>(null);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { branch } = useBranch();
  const [state, dispatch] = useReducer(calendarReducer, initialState);

  /* ---------- DATA LOADING ---------- */
  async function reload() {
    if (!branch) return;

    // 1️⃣ STAFF
    const staff = await getStaffByBranch(branch.id);
    dispatch({ type: "SET_STAFF", payload: staff });

    // 2️⃣ SCHEDULES
    const sched = await Promise.all(
      staff.map((s) => getScheduleForStaff(s.id))
    );

    dispatch({
      type: "SET_SCHEDULES",
      payload: Object.fromEntries(
        staff.map((s, i) => [s.id, sched[i]])
      ),
    });

    // 3️⃣ APPOINTMENTS OF SELECTED DAY
    const res = await getAppointmentsByDay({
      branchId: branch.id,
      date: state.date,
    });

    dispatch({
      type: "SET_APPOINTMENTS",
      payload: res.data.map((a: any) => ({
        ...a,
        conceptualStatus: getConceptualStatus(a.start, a.end),
      })),
    });

    // 4️⃣ DAILY COUNTS OF WEEK
    const selected = DateTime.fromISO(state.date);
    const startOfWeek = selected.startOf("week").plus({ days: 1 });

    const weekDays = [...Array(7)].map(
      (_, i) => startOfWeek.plus({ days: i }).toISODate()!
    );

    const weekRes = await Promise.all(
      weekDays.map((d) =>
        getAppointmentsByDay({ branchId: branch.id, date: d })
      )
    );

    dispatch({
      type: "SET_DAILY_COUNTS",
      payload: Object.fromEntries(
        weekRes.map((r, i) => [weekDays[i], r.data.length])
      ),
    });
  }

  useEffect(() => {
    void reload();
  }, [branch, state.date]);

  return (
    <CalendarContext.Provider value={{ state, dispatch, reload }}>
      {children}
    </CalendarContext.Provider>
  );
}

/* ---------- HOOKS ---------- */

export function useCalendar() {
  return useContext(CalendarContext);
}

export function useCalendarActions() {
  const { dispatch } = useCalendar();

  return {
    setDate: (d: string) =>
      dispatch({ type: "SET_DATE", payload: d }),

    openNewAppointment: (prefill?: Prefill) =>
      dispatch({ type: "OPEN_SHEET", payload: prefill }),

    closeSheet: () => dispatch({ type: "CLOSE_SHEET" }),

    selectEvent: (event: any, rect: DOMRect) =>
      dispatch({
        type: "SELECT_EVENT",
        payload: { event, rect },
      }),

    clearEvent: () => dispatch({ type: "CLEAR_EVENT" }),
  };
}