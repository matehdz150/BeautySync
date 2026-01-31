/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
  useCallback,
} from "react";
import { DateTime } from "luxon";
import { useBranch } from "@/context/BranchContext";
import { getAppointmentsByDay } from "@/lib/services/appointments";
import { getStaffByBranch } from "@/lib/services/staff";
import { getScheduleForStaff } from "@/lib/services/staffSchedules";
import { getConceptualStatus } from "@/lib/helpers/conceptualStatus";

/* ---------- TYPES ---------- */

export type Prefill = {
  defaultStaffId?: string;
  startISO?: string;
  presetServices?: {
    id: string;
    name: string;
    durationMin: number;
    priceCents?: number;
  }[];
};

export type SlotPrefill = {
  pinnedStaffId: string;
  pinnedStartIso: string;
  pinnedStaffName: string;
};

type CalendarState = {
  date: string;

  staff: string[];
  schedules: Record<string, unknown[]>;
  appointments: any[];
  dailyCounts: Record<string, number>;

  dialogOpen: boolean;
  prefill: Prefill;

  selectedAppointment?: any; // 👈 NEW
  selectedAppointmentId?: string;

  selectedEvent: unknown | null;
  anchorRect: DOMRect | null;

  view: CalendarViewState;

  slotDialogOpen: boolean;
  slotPrefill: SlotPrefill | null;
};

type CalendarViewState = {
  maxVisibleStaff: number; // ej. 5, 7
  staffOffset: number; // ventana actual
  enabledStaffIds: string[]; // filtros activos
};

type Action =
  | { type: "SET_DATE"; payload: string }
  | { type: "SET_STAFF"; payload: unknown[] }
  | { type: "SET_SCHEDULES"; payload: Record<string, unknown[]> }
  | { type: "SET_APPOINTMENTS"; payload: any[] }
  | { type: "SET_DAILY_COUNTS"; payload: Record<string, number> }
  | { type: "OPEN_SHEET"; payload?: Prefill }
  | { type: "CLOSE_SHEET" }
  | { type: "SELECT_EVENT"; payload: { event: unknown; rect: DOMRect } }
  | { type: "CLEAR_EVENT" }
  | { type: "ADD_APPOINTMENTS"; payload: any[] }
  | { type: "OPEN_APPOINTMENT"; payload: any }
  | { type: "CLOSE_APPOINTMENT" }
  | { type: "SET_MAX_VISIBLE_STAFF"; payload: number }
  | { type: "SET_STAFF_OFFSET"; payload: number }
  | { type: "OPEN_SLOT_SHEET"; payload: SlotPrefill }
  | { type: "CLOSE_SLOT_SHEET" }
  | { type: "SET_ENABLED_STAFF"; payload: string[] };

/* ---------- INITIAL STATE ---------- */

const initialState: CalendarState = {
  date: DateTime.now().toISODate(),

  staff: [],
  schedules: {},
  appointments: [],
  dailyCounts: {},

  dialogOpen: false,
  prefill: {},

  selectedAppointment: undefined,

  selectedEvent: null,
  anchorRect: null,
  view: {
    maxVisibleStaff: 7,
    staffOffset: 0,
    enabledStaffIds: [],
  },

  slotDialogOpen: false,
  slotPrefill: null,
};

/* ---------- REDUCER ---------- */

function calendarReducer(state: CalendarState, action: Action): CalendarState {
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

    case "ADD_APPOINTMENTS":
      return {
        ...state,
        appointments: [...state.appointments, ...action.payload].sort(
          (a, b) =>
            DateTime.fromISO(a.startISO).toMillis() -
            DateTime.fromISO(b.startISO).toMillis()
        ),
      };

    case "OPEN_APPOINTMENT":
      return {
        ...state,
        selectedAppointmentId: action.payload,
      };

    case "CLOSE_APPOINTMENT":
      return {
        ...state,
        selectedAppointmentId: undefined,
      };

    case "SET_MAX_VISIBLE_STAFF":
      return {
        ...state,
        view: {
          ...state.view,
          maxVisibleStaff: action.payload,
          staffOffset: 0,
        },
      };

    case "SET_STAFF_OFFSET":
      return {
        ...state,
        view: {
          ...state.view,
          staffOffset: action.payload,
        },
      };

    case "SET_ENABLED_STAFF":
      return {
        ...state,
        view: {
          ...state.view,
          enabledStaffIds: action.payload,
          staffOffset: 0,
        },
      };

    case "OPEN_SLOT_SHEET":
      return { ...state, slotDialogOpen: true, slotPrefill: action.payload };

    case "CLOSE_SLOT_SHEET":
      return { ...state, slotDialogOpen: false, slotPrefill: null };

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

  const reload = useCallback(async () => {
    if (!branch) return;

    const staff = await getStaffByBranch(branch.id);
    dispatch({ type: "SET_STAFF", payload: staff });

    if (state.view.enabledStaffIds.length === 0) {
      dispatch({
        type: "SET_ENABLED_STAFF",
        payload: staff.map((s: any) => s.id),
      });
    }

    const sched = await Promise.all(
      staff.map((s) => getScheduleForStaff(s.id))
    );

    dispatch({
      type: "SET_SCHEDULES",
      payload: Object.fromEntries(staff.map((s, i) => [s.id, sched[i]])),
    });

    const res = await getAppointmentsByDay({
      branchId: branch.id,
      date: state.date,
    });

    console.log('Daily: ',res)

    const mappedAppointments = res.data.map((a: any) => {
      const start = DateTime.fromISO(a.start);
      const end = DateTime.fromISO(a.end);

      return {
        id: a.id,
        bookingId: a.bookingId ?? null,
        priceCents: a.priceCents ?? a.service?.priceCents ?? 0,
        staffId: a.staff.id,
        staffName: a.staff.name,
        client: a.client?.name ?? "Cliente",
        serviceName: a.service?.name ?? "",
        serviceColor: a.service?.categoryColor ?? "#A78BFA",
        startISO: a.start,
        endISO: a.end,
        startTime: start.toLocal().toFormat("H:mm"),
        minutes: end.diff(start, "minutes").minutes,
        conceptualStatus: getConceptualStatus(a.start, a.end),
        raw: a,
      };
    });

    dispatch({ type: "SET_APPOINTMENTS", payload: mappedAppointments });

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
  }, [branch, state.date, dispatch]);

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch, state.date]);

  useEffect(() => {
    let id: NodeJS.Timeout | null = null;

    function start() {
      if (!id) {
        reload(); // 👈 refresh inmediato al volver
        id = setInterval(reload, 60_000);
      }
    }

    function stop() {
      if (id) {
        clearInterval(id);
        id = null;
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") start();
      else stop();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    start();

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [reload]);

  const filteredStaff = state.view.enabledStaffIds.length
    ? state.staff.filter((s: any) => state.view.enabledStaffIds.includes(s.id))
    : state.staff;

  const visibleStaff = filteredStaff.slice(
    state.view.staffOffset,
    state.view.staffOffset + state.view.maxVisibleStaff
  );

  return (
    <CalendarContext.Provider
      value={{ state, dispatch, reload, visibleStaff, filteredStaff }}
    >
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
    setDate: (d: string) => dispatch({ type: "SET_DATE", payload: d }),

    openNewAppointment: (prefill?: Prefill) =>
      dispatch({ type: "OPEN_SHEET", payload: prefill }),

    closeSheet: () => dispatch({ type: "CLOSE_SHEET" }),

    selectEvent: (event: any, rect: DOMRect) =>
      dispatch({ type: "SELECT_EVENT", payload: { event, rect } }),

    clearEvent: () => dispatch({ type: "CLEAR_EVENT" }),

    addAppointments: (apps: any[]) =>
      dispatch({ type: "ADD_APPOINTMENTS", payload: apps }),

    /* ---------- NEW ---------- */
    openAppointment: (a: any) =>
      dispatch({ type: "OPEN_APPOINTMENT", payload: a }),

    openAppointmentById: (id: string) =>
      dispatch({ type: "OPEN_APPOINTMENT", payload: id }),

    closeAppointment: () => dispatch({ type: "CLOSE_APPOINTMENT" }),

    setMaxVisibleStaff: (n: number) =>
      dispatch({ type: "SET_MAX_VISIBLE_STAFF", payload: n }),

    nextStaffPage: () =>
      dispatch({
        type: "SET_STAFF_OFFSET",
        payload: (prev: number) => prev + 1,
      }),

    prevStaffPage: () =>
      dispatch({
        type: "SET_STAFF_OFFSET",
        payload: (prev: number) => Math.max(0, prev - 1),
      }),

    setEnabledStaff: (ids: string[]) =>
      dispatch({ type: "SET_ENABLED_STAFF", payload: ids }),

    openSlotBooking: (payload: SlotPrefill) =>
      dispatch({ type: "OPEN_SLOT_SHEET", payload }),

    closeSlotBooking: () => dispatch({ type: "CLOSE_SLOT_SHEET" }),
  };
}
