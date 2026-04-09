/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from "react";
import { DateTime } from "luxon";
import { useBranch } from "@/context/BranchContext";
import { getConceptualStatus } from "@/lib/helpers/conceptualStatus";
import { API_URL } from "@/lib/services/api";
import {
  getCalendarDay,
  getCalendarWeekSummary,
  type GetCalendarDayResponse,
} from "@/lib/services/calendar";
import type { Service } from "@/lib/services/services";
import { getStaffByBranch, type Staff } from "@/lib/services/staff";
import {
  getSchedulesForStaffMembers,
  type StaffSchedule,
} from "@/lib/services/staffSchedules";
import { useCalendarData } from "@/hooks/useCalendarData";
import { invalidateTimeOffAvailabilityCache } from "@/lib/services/staff-time-off";

export type Prefill = {
  defaultStaffId?: string;
  startISO?: string;
  presetServices?: Service[];
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

type CalendarRealtimeTimeOff = {
  id: number;
  staffId: string;
  start: string;
  end: string;
  reason?: string;
};

type CalendarInvalidateEvent = {
  branchId?: string;
  reason?: string;
  at?: string;
  staffId?: string;
  start?: string;
  end?: string;
  patch?: {
    entityType?: "TIME_OFF";
    operation?: "created" | "updated" | "deleted";
    staffId?: string;
    start?: string;
    end?: string;
    timeOffs?: CalendarRealtimeTimeOff[];
    removedTimeOffIds?: number[];
    previousStart?: string;
    previousEnd?: string;
    previousTimeOffId?: number;
  };
};

type CalendarState = {
  date: string;
  timezone: string;
  staff: Staff[];
  schedules: Record<string, StaffSchedule[]>;
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
  | { type: "SET_TIMEZONE"; payload: string }
  | { type: "SET_STAFF"; payload: Staff[] }
  | { type: "SET_SCHEDULES"; payload: Record<string, StaffSchedule[]> }
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
  | { type: "NEXT_STAFF_PAGE" }
  | { type: "PREV_STAFF_PAGE" }
  | { type: "SET_ENABLED_STAFF"; payload: string[] };

type CalendarContextType = {
  state: CalendarState;
  dispatch: Dispatch<Action>;
  reload: () => Promise<void>;
  visibleStaff: Staff[];
};

const initialState: CalendarState = {
  date: DateTime.now().toISODate()!,
  timezone: "America/Mexico_City",
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

function reducer(state: CalendarState, action: Action): CalendarState {
  switch (action.type) {
    case "SET_DATE":
      return { ...state, date: action.payload };
    case "SET_TIMEZONE":
      return { ...state, timezone: action.payload };
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
      return { ...state, selectedAppointmentId: action.payload };
    case "CLOSE_APPOINTMENT":
      return { ...state, selectedAppointmentId: undefined };
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
    case "NEXT_STAFF_PAGE": {
      const nextOffset = state.view.staffOffset + state.view.maxVisibleStaff;

      return {
        ...state,
        view: {
          ...state.view,
          staffOffset: Math.min(
            nextOffset,
            Math.max(state.staff.length - state.view.maxVisibleStaff, 0),
          ),
        },
      };
    }
    case "PREV_STAFF_PAGE": {
      const prevOffset = state.view.staffOffset - state.view.maxVisibleStaff;

      return {
        ...state,
        view: {
          ...state.view,
          staffOffset: Math.max(prevOffset, 0),
        },
      };
    }
    default:
      return state;
  }
}

function sameStringArray(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function getWeekSummaryKey(branchId: string, date: string) {
  const selected = DateTime.fromISO(date);
  const startOfWeek = selected.startOf("week").plus({ days: 1 }).toISODate()!;

  return `${branchId}:${startOfWeek}`;
}

function mapAppointments(appointments: any[]): CalendarAppointment[] {
  return appointments.map((appointment: any) => {
    const start = DateTime.fromISO(appointment.start);
    const end = DateTime.fromISO(appointment.end);

    return {
      id: appointment.id,
      staffId: appointment.staffId,
      bookingId: appointment.bookingId ?? null,
      client: appointment.clientName ?? "Cliente",
      serviceName: appointment.serviceName ?? "Servicio",
      staffName: appointment.staffName ?? "",
      color: appointment.color ?? "#A78BFA",
      startISO: appointment.start,
      endISO: appointment.end,
      startTime: start.toFormat("H:mm"),
      minutes: end.diff(start, "minutes").minutes,
      conceptualStatus: getConceptualStatus(appointment.start, appointment.end),
      raw: appointment,
      type: "APPOINTMENT",
    };
  });
}

function mapTimeOffs(timeOffs: any[]): CalendarTimeOff[] {
  return timeOffs.map((timeOff: any) => {
    const start = DateTime.fromISO(timeOff.start);
    const end = DateTime.fromISO(timeOff.end);

    return {
      id: `timeoff-${timeOff.id}`,
      staffId: timeOff.staffId,
      startISO: timeOff.start,
      endISO: timeOff.end,
      startTime: start.toFormat("H:mm"),
      minutes: end.diff(start, "minutes").minutes,
      reason: timeOff.reason ?? undefined,
      type: "TIME_OFF",
    };
  });
}

function sortTimeOffs(timeOffs: CalendarTimeOff[]) {
  return [...timeOffs].sort((a, b) => {
    const startDiff =
      DateTime.fromISO(a.startISO).toMillis() -
      DateTime.fromISO(b.startISO).toMillis();

    if (startDiff !== 0) {
      return startDiff;
    }

    return a.id.localeCompare(b.id);
  });
}

function affectsSelectedDate(params: {
  selectedDate: string;
  timezone: string;
  timeOff: CalendarRealtimeTimeOff;
}) {
  return (
    DateTime.fromISO(params.timeOff.start, { zone: "utc" })
      .setZone(params.timezone)
      .toISODate() === params.selectedDate
  );
}

const CalendarContext = createContext<CalendarContextType | null>(null);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { branch } = useBranch();
  const branchId = branch?.id;
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  const staffLoadSeqRef = useRef(0);
  const timezoneRef = useRef("America/Mexico_City");

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const loadStaffResources = useCallback(async () => {
    if (!branchId) return;

    const loadSeq = ++staffLoadSeqRef.current;
    const staff = await getStaffByBranch(branchId);
    const schedules = await getSchedulesForStaffMembers(
      staff.map((member) => member.id),
    );

    if (loadSeq !== staffLoadSeqRef.current) {
      return;
    }

    dispatch({ type: "SET_STAFF", payload: staff });
    dispatch({ type: "SET_SCHEDULES", payload: schedules });

    const enabledStaffIds = stateRef.current.view.enabledStaffIds.filter((staffId) =>
      staff.some((member) => member.id === staffId),
    );
    const nextEnabledStaffIds =
      enabledStaffIds.length > 0
        ? enabledStaffIds
        : staff.map((member) => member.id);

    if (!sameStringArray(nextEnabledStaffIds, stateRef.current.view.enabledStaffIds)) {
      dispatch({
        type: "SET_ENABLED_STAFF",
        payload: nextEnabledStaffIds,
      });
    }
  }, [branchId]);

  const applyDayResponse = useCallback((response: GetCalendarDayResponse) => {
    dispatch({
      type: "SET_APPOINTMENTS",
      payload: mapAppointments(response.appointments),
    });
    dispatch({
      type: "SET_TIMEOFFS",
      payload: mapTimeOffs(response.timeOffs),
    });
  }, []);

  const selectedDayRequestKey = useMemo(
    () => (branchId ? `${branchId}-${state.date}` : null),
    [branchId, state.date],
  );

  const weekSummaryRequestKey = useMemo(
    () => (branchId ? getWeekSummaryKey(branchId, state.date) : null),
    [branchId, state.date],
  );

  const fetchSelectedDay = useCallback(
    (signal: AbortSignal) => {
      if (!branchId) {
        return Promise.reject(new Error("Missing branchId"));
      }

      return getCalendarDay(
        {
          branchId,
          date: state.date,
        },
        { signal },
      );
    },
    [branchId, state.date],
  );

  const fetchWeekSummary = useCallback(
    (signal: AbortSignal) => {
      if (!branchId) {
        return Promise.reject(new Error("Missing branchId"));
      }

      return getCalendarWeekSummary(
        {
          branchId,
          date: state.date,
        },
        { signal },
      );
    },
    [branchId, state.date],
  );

  const {
    data: selectedDayData,
    refresh: refreshSelectedDay,
  } = useCalendarData({
    requestKey: selectedDayRequestKey,
    enabled: Boolean(branchId),
    fetcher: fetchSelectedDay,
  });

  const {
    data: weekSummaryData,
    refresh: refreshWeekSummary,
  } = useCalendarData({
    requestKey: weekSummaryRequestKey,
    enabled: Boolean(branchId),
    fetcher: fetchWeekSummary,
  });

  useEffect(() => {
    if (!selectedDayData) {
      return;
    }

    timezoneRef.current = selectedDayData.timezone;
    dispatch({
      type: "SET_TIMEZONE",
      payload: selectedDayData.timezone,
    });
    applyDayResponse(selectedDayData);
  }, [applyDayResponse, selectedDayData]);

  useEffect(() => {
    if (!weekSummaryData) {
      return;
    }

    dispatch({
      type: "SET_DAILY_COUNTS",
      payload: Object.fromEntries(
        weekSummaryData.days.map((day) => [day.date, day.totalAppointments]),
      ),
    });
  }, [weekSummaryData]);

  const reload = useCallback(async () => {
    await Promise.all([
      loadStaffResources(),
      refreshSelectedDay(),
      refreshWeekSummary(),
    ]);
  }, [loadStaffResources, refreshSelectedDay, refreshWeekSummary]);

  useEffect(() => {
    if (!branchId) return;

    void loadStaffResources();
  }, [branchId, loadStaffResources]);

  useEffect(() => {
    if (!branchId) return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const reconnect = () => {
      if (closed) return;
      reconnectTimer = setTimeout(connect, 3000);
    };

    const connect = () => {
      eventSource = new EventSource(
        `${API_URL}/calendar/stream?branchId=${branchId}`,
        { withCredentials: true },
      );

      eventSource.addEventListener("calendar.invalidate", (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data) as CalendarInvalidateEvent;

          if (payload.branchId && payload.branchId !== branchId) {
            return;
          }

          const patch = payload.patch;
          if (patch?.entityType !== "TIME_OFF") {
            return;
          }

          const selectedDate = stateRef.current.date;
          const timezone = timezoneRef.current;

          const nextTimeOffs = [...stateRef.current.timeOffs];
          const removedIds = new Set(
            (patch.removedTimeOffIds ?? []).map((id) => `timeoff-${id}`),
          );

          if (patch.previousTimeOffId) {
            removedIds.add(`timeoff-${patch.previousTimeOffId}`);
          }

          const filteredTimeOffs = nextTimeOffs.filter(
            (timeOff) => !removedIds.has(timeOff.id),
          );

          const incomingTimeOffs = (patch.timeOffs ?? []).filter((timeOff) =>
            affectsSelectedDate({
              selectedDate,
              timezone,
              timeOff,
            }),
          );

          const mappedIncomingTimeOffs = mapTimeOffs(incomingTimeOffs);
          const mergedTimeOffs = sortTimeOffs([
            ...filteredTimeOffs.filter(
              (timeOff) =>
                !mappedIncomingTimeOffs.some(
                  (incomingTimeOff) => incomingTimeOff.id === timeOff.id,
                ),
            ),
            ...mappedIncomingTimeOffs,
          ]);

          dispatch({
            type: "SET_TIMEOFFS",
            payload: mergedTimeOffs,
          });

          const datesToInvalidate = new Set<string>();

          for (const timeOff of patch.timeOffs ?? []) {
            const date = DateTime.fromISO(timeOff.start, { zone: "utc" })
              .setZone(timezone)
              .toISODate();

            if (date) {
              datesToInvalidate.add(date);
            }
          }

          for (const iso of [patch.start, patch.end, patch.previousStart, patch.previousEnd]) {
            if (!iso) {
              continue;
            }

            const date = DateTime.fromISO(iso, { zone: "utc" })
              .setZone(timezone)
              .toISODate();

            if (date && patch.staffId) {
              datesToInvalidate.add(date);
            }
          }

          for (const date of datesToInvalidate) {
            if (patch.staffId) {
              invalidateTimeOffAvailabilityCache({
                branchId,
                staffId: patch.staffId,
                date,
              });
            }
          }
        } catch {
          // Ignore malformed realtime payloads and keep current state.
        }
      });

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        reconnect();
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (eventSource) eventSource.close();
    };
  }, [branchId]);

  const visibleStaff = useMemo(() => {
    const filteredStaff =
      state.view.enabledStaffIds.length > 0
        ? state.staff.filter((member) =>
            state.view.enabledStaffIds.includes(member.id),
          )
        : state.staff;

    return filteredStaff.slice(
      state.view.staffOffset,
      state.view.staffOffset + state.view.maxVisibleStaff,
    );
  }, [
    state.staff,
    state.view.enabledStaffIds,
    state.view.maxVisibleStaff,
    state.view.staffOffset,
  ]);

  return (
    <CalendarContext.Provider value={{ state, dispatch, reload, visibleStaff }}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const ctx = useContext(CalendarContext);
  if (!ctx) {
    throw new Error("useCalendar must be used inside CalendarProvider");
  }
  return ctx;
}

export function useCalendarActions() {
  const { dispatch } = useCalendar();

  return useMemo(
    () => ({
      setDate: (date: string) => dispatch({ type: "SET_DATE", payload: date }),
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
      addAppointments: (appointments: any[]) =>
        dispatch({ type: "ADD_APPOINTMENTS", payload: appointments }),
      openBlockDetail: (payload: BlockDetailPrefill) =>
        dispatch({ type: "OPEN_BLOCK_DETAIL_SHEET", payload }),
      closeBlockDetail: () => dispatch({ type: "CLOSE_BLOCK_DETAIL_SHEET" }),
      nextStaffPage: () => dispatch({ type: "NEXT_STAFF_PAGE" }),
      prevStaffPage: () => dispatch({ type: "PREV_STAFF_PAGE" }),
    }),
    [dispatch],
  );
}
