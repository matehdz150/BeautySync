/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
  useCallback,
  type Dispatch,
} from "react";
import { DateTime } from "luxon";
import { useBranch } from "@/context/BranchContext";
import { getCalendarDay } from "@/lib/services/calendar";
import { getStaffByBranch, Staff } from "@/lib/services/staff";
import { getScheduleForStaff } from "@/lib/services/staffSchedules";
import { getConceptualStatus } from "@/lib/helpers/conceptualStatus";

/* ---------- TYPES ---------- */

export type Prefill = {
  defaultStaffId?: string;
  startISO?: string;
};

export type BlockDetailPrefill = {
  staffTimeOffId: string;
  staffId: string;
  branchId: string;
};

export type SlotPrefill = {
  pinnedStaffId: string;
  pinnedStartIso: string;
  pinnedStaffName: string;
};

export type CalendarAppointment = {
  id: string;
  bookingId?: string | null;
  staffId: string;
  client: string;
  serviceName: string;
  color: string;
  startISO: string;
  endISO: string;
  startTime: string;
  minutes: number;
  conceptualStatus: string;
  type: "APPOINTMENT";
};

export type CalendarTimeOff = {
  id: string;
  staffId: string;
  startISO: string;
  endISO: string;
  startTime: string;
  minutes: number;
  reason?: string;
  type: "TIME_OFF";
};

type CalendarState = {
  date: string;

  staff: Staff[];
  schedules: Record<string, unknown[]>;
  appointments: CalendarAppointment[];
  timeOffs: CalendarTimeOff[];
  dailyCounts: Record<string, number>;

  dialogOpen: boolean;
  BlockDialogOpen: boolean;
  BlockDetailOpen: boolean;
  prefill: Prefill;

  selectedAppointmentId?: string;
  selectedBlockId?: string;

  selectedEvent: unknown | null;
  anchorRect: DOMRect | null;

  view: {
    maxVisibleStaff: number;
    staffOffset: number;
    enabledStaffIds: string[];
  };

  slotDialogOpen: boolean;
  slotPrefill: SlotPrefill | null;
};

type Action =
  | { type: "SET_DATE"; payload: string }
  | { type: "SET_STAFF"; payload: Staff[] }
  | { type: "SET_SCHEDULES"; payload: Record<string, unknown[]> }
  | { type: "SET_APPOINTMENTS"; payload: CalendarAppointment[] }
  | { type: "SET_TIMEOFFS"; payload: CalendarTimeOff[] }
  | { type: "SET_DAILY_COUNTS"; payload: Record<string, number> }
  | { type: "OPEN_SHEET"; payload?: Prefill }
  | { type: "OPEN_BLOCK_SHEET"; payload?: Prefill }
  | { type: "CLOSE_SHEET" }
  | { type: "CLOSE_BLOCK_SHEET" }
  | { type: "OPEN_APPOINTMENT"; payload: string }
  | { type: "CLOSE_APPOINTMENT" }
  | { type: "OPEN_SLOT_SHEET"; payload: SlotPrefill }
  | { type: "CLOSE_SLOT_SHEET" }
  | { type: "ADD_APPOINTMENTS"; payload: any[] }
  | { type: "OPEN_BLOCK_DETAIL_SHEET"; payload: BlockDetailPrefill }
  | { type: "CLOSE_BLOCK_DETAIL_SHEET" }
  | { type: "SET_ENABLED_STAFF"; payload: string[] };

type CalendarContextType = {
  state: CalendarState;
  dispatch: Dispatch<Action>;
  reload: () => Promise<void>;
  visibleStaff: Staff[];
};

/* ---------- INITIAL STATE ---------- */

const initialState: CalendarState = {
  date: DateTime.now().toISODate()!,

  staff: [],
  schedules: {},
  appointments: [],
  timeOffs: [],
  dailyCounts: {},

  dialogOpen: false,
  BlockDialogOpen: false,
  BlockDetailOpen: false,
  prefill: {},

  selectedAppointmentId: undefined,
  selectedBlockId: undefined,

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

function reducer(state: CalendarState, action: Action): CalendarState {
  switch (action.type) {
    case "SET_DATE":
      return { ...state, date: action.payload };

    case "SET_STAFF":
      return { ...state, staff: action.payload };

    case "SET_SCHEDULES":
      return { ...state, schedules: action.payload };

    case "SET_APPOINTMENTS":
      return { ...state, appointments: action.payload };

    case "SET_TIMEOFFS":
      return { ...state, timeOffs: action.payload };

    case "SET_DAILY_COUNTS":
      return { ...state, dailyCounts: action.payload };

    case "OPEN_SHEET":
      return { ...state, dialogOpen: true, prefill: action.payload ?? {} };

    case "OPEN_BLOCK_SHEET":
      return { ...state, BlockDialogOpen: true, prefill: action.payload ?? {} };

    case "CLOSE_SHEET":
      return { ...state, dialogOpen: false, prefill: {} };

    case "CLOSE_BLOCK_SHEET":
      return { ...state, BlockDialogOpen: false, prefill: {} };

    case "OPEN_SLOT_SHEET":
      return { ...state, slotDialogOpen: true, slotPrefill: action.payload };

    case "CLOSE_SLOT_SHEET":
      return { ...state, slotDialogOpen: false, slotPrefill: null };

    case "OPEN_APPOINTMENT":
      return {
        ...state,
        selectedAppointmentId: action.payload,
      };

    case "OPEN_BLOCK_DETAIL_SHEET":
      return {
        ...state,
        BlockDetailOpen: true,
        selectedBlockId: action.payload.staffTimeOffId,
      };

    case "CLOSE_BLOCK_DETAIL_SHEET":
      return {
        ...state,
        BlockDetailOpen: false,
        selectedBlockId: undefined,
      };

    case "CLOSE_BLOCK_DETAIL_SHEET":
      return {
        ...state,
        selectedBlockId: undefined,
      };

    case "ADD_APPOINTMENTS":
      return {
        ...state,
        appointments: [...state.appointments, ...action.payload].sort(
          (a, b) =>
            DateTime.fromISO(a.startISO).toMillis() -
            DateTime.fromISO(b.startISO).toMillis(),
        ),
      };

    case "SET_ENABLED_STAFF":
      return {
        ...state,
        view: {
          ...state.view,
          enabledStaffIds: action.payload,
        },
      };

    default:
      return state;
  }
}

/* ---------- CONTEXT ---------- */

const CalendarContext = createContext<CalendarContextType | null>(null);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { branch } = useBranch();
  const branchId = branch?.id;
  const [state, dispatch] = useReducer(reducer, initialState);

  const reload = useCallback(async () => {
    if (!branchId) return;

    const staff = await getStaffByBranch(branchId);
    dispatch({ type: "SET_STAFF", payload: staff });

    if (state.view.enabledStaffIds.length === 0) {
      dispatch({
        type: "SET_ENABLED_STAFF",
        payload: staff.map((s) => s.id),
      });
    }

    const sched = await Promise.all(
      staff.map((s) => getScheduleForStaff(s.id)),
    );

    dispatch({
      type: "SET_SCHEDULES",
      payload: Object.fromEntries(staff.map((s, i) => [s.id, sched[i]])),
    });

    const res = await getCalendarDay({
      branchId,
      date: state.date,
    });

    console.log(res);

    const appointments: CalendarAppointment[] = res.appointments.map(
      (a: any) => {
        const start = DateTime.fromISO(a.start);
        const end = DateTime.fromISO(a.end);

        return {
          id: a.id,
          staffId: a.staffId,

          bookingId: a.bookingId ?? null, // 🔥 CRÍTICO

          client: a.clientName ?? "Cliente",
          serviceName: a.serviceName ?? "Servicio",

          staffName: a.staffName ?? "", // opcional pero útil

          color: a.color ?? "#A78BFA",

          startISO: a.start,
          endISO: a.end,
          startTime: start.toFormat("H:mm"),
          minutes: end.diff(start, "minutes").minutes,

          conceptualStatus: getConceptualStatus(a.start, a.end),

          raw: a, // 🔥 te salva después

          type: "APPOINTMENT",
        };
      },
    );

    const timeOffs: CalendarTimeOff[] = res.timeOffs.map((t: any) => {
      const start = DateTime.fromISO(t.start);
      const end = DateTime.fromISO(t.end);

      return {
        id: `timeoff-${t.id}`,
        staffId: t.staffId,
        startISO: t.start,
        endISO: t.end,
        startTime: start.toFormat("H:mm"),
        minutes: end.diff(start, "minutes").minutes,
        reason: t.reason ?? undefined,
        type: "TIME_OFF",
      };
    });

    dispatch({ type: "SET_APPOINTMENTS", payload: appointments });
    dispatch({ type: "SET_TIMEOFFS", payload: timeOffs });

    const selected = DateTime.fromISO(state.date);
    const startOfWeek = selected.startOf("week").plus({ days: 1 });

    const weekDays = [...Array(7)].map(
      (_, i) => startOfWeek.plus({ days: i }).toISODate()!,
    );

    const weekRes = await Promise.all(
      weekDays.map((d) => getCalendarDay({ branchId, date: d })),
    );

    dispatch({
      type: "SET_DAILY_COUNTS",
      payload: Object.fromEntries(
        weekRes.map((r, i) => [weekDays[i], r.appointments.length]),
      ),
    });
  }, [branchId, state.date, state.view.enabledStaffIds.length]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filteredStaff =
    state.view.enabledStaffIds.length > 0
      ? state.staff.filter((s) => state.view.enabledStaffIds.includes(s.id))
      : state.staff;

  const visibleStaff = filteredStaff.slice(
    state.view.staffOffset,
    state.view.staffOffset + state.view.maxVisibleStaff,
  );

  return (
    <CalendarContext.Provider value={{ state, dispatch, reload, visibleStaff }}>
      {children}
    </CalendarContext.Provider>
  );
}

/* ---------- HOOKS ---------- */

export function useCalendar() {
  const ctx = useContext(CalendarContext);
  if (!ctx) {
    throw new Error("useCalendar must be used inside CalendarProvider");
  }
  return ctx;
}

export function useCalendarActions() {
  const { dispatch } = useCalendar();

  return {
    setDate: (d: string) => dispatch({ type: "SET_DATE", payload: d }),
    openNewAppointment: (prefill?: Prefill) =>
      dispatch({ type: "OPEN_SHEET", payload: prefill }),
    openBlockTime: (prefill?: Prefill) =>
      dispatch({ type: "OPEN_BLOCK_SHEET", payload: prefill }),
    closeSheet: () => dispatch({ type: "CLOSE_SHEET" }),
    closeBlockTime: () => dispatch({ type: "CLOSE_BLOCK_SHEET" }),
    setEnabledStaff: (ids: string[]) =>
      dispatch({ type: "SET_ENABLED_STAFF", payload: ids }),

    openAppointmentById: (id: string) =>
      dispatch({ type: "OPEN_APPOINTMENT", payload: id }),

    closeAppointment: () => dispatch({ type: "CLOSE_APPOINTMENT" }),
    openSlotBooking: (payload: SlotPrefill) =>
      dispatch({ type: "OPEN_SLOT_SHEET", payload }),

    closeSlotBooking: () => dispatch({ type: "CLOSE_SLOT_SHEET" }),
    addAppointments: (apps: any[]) =>
      dispatch({ type: "ADD_APPOINTMENTS", payload: apps }),
    openBlockDetail: (payload: BlockDetailPrefill) =>
      dispatch({ type: "OPEN_BLOCK_DETAIL_SHEET", payload }),
    closeBlockDetail: () => dispatch({ type: "CLOSE_BLOCK_DETAIL_SHEET" }),
  };
}
