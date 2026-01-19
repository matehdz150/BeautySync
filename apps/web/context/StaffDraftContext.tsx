import { StaffScheduleInput } from "@/lib/services/staffSchedules";
import { createContext, ReactNode, useContext, useReducer } from "react";

type StaffBaseDraft = {
  name: string;
  email: string;
  phone?: string;
  jobRole?: string; // opcional
  permissionRole: "staff" | "manager";
};

export type StaffScheduleDraft = {
  id: string; // uuid local
  dayOfWeek: number; // 0–6
  startTime: string; // "09:00"
  endTime: string; // "12:00"
};

export type StaffDraftState = {
  base: StaffBaseDraft & {
    avatarUrl?: string | null;
    avatarPublicId?: string | null;
  };
  schedules: StaffScheduleDraft[];
  services: string[];

  originalServices: string[]; // 👈 NUEVO

  createdStaffId?: string;
};

export type StaffDraftAction =
  | { type: "SET_BASE"; payload: Partial<StaffBaseDraft> }
  | { type: "ADD_SCHEDULE"; payload: StaffScheduleInput }
  | {
      type: "UPDATE_SCHEDULE";
      payload: { index: number; data: Partial<StaffScheduleInput> };
    }
  | { type: "REMOVE_SCHEDULE"; payload: number }
  | { type: "CLEAR_DAY"; payload: number }
  | { type: "TOGGLE_SERVICE"; payload: { serviceId: string } }
  | { type: "SET_CREATED_STAFF_ID"; payload: string }
  | {
      type: "HYDRATE";
      payload: {
        base: StaffBaseDraft;
        schedules: StaffScheduleDraft[];
        services: string[];
        staffId: string;
      };
    }
  | {
      type: "SET_AVATAR";
      payload: { url: string; publicId: string };
    }
  | { type: "CLEAR_AVATAR" }
  | { type: "RESET" };

const initialSchedules = [
  1, // Lunes
  2, // Martes
  3, // Miércoles
  4, // Jueves
  5, // Viernes
  6, // Sábado
].map((day) => ({
  staffId: "draft",
  dayOfWeek: day,
  startTime: "08:00",
  endTime: "19:00",
}));

const initialState: StaffDraftState = {
  base: {
    name: "",
    email: "",
    permissionRole: "staff",
  },
  originalServices: [],
  schedules: initialSchedules,
  services: [],
};

function reducer(
  state: StaffDraftState,
  action: StaffDraftAction
): StaffDraftState {
  switch (action.type) {
    case "SET_BASE":
      return {
        ...state,
        base: { ...state.base, ...action.payload },
      };

    case "ADD_SCHEDULE":
      return {
        ...state,
        schedules: [...state.schedules, action.payload],
      };

    case "UPDATE_SCHEDULE":
      return {
        ...state,
        schedules: state.schedules.map((s, i) =>
          i === action.payload.index ? { ...s, ...action.payload.data } : s
        ),
      };

    case "REMOVE_SCHEDULE":
      return {
        ...state,
        schedules: state.schedules.filter((_, i) => i !== action.payload),
      };

    case "CLEAR_DAY":
      return {
        ...state,
        schedules: state.schedules.filter(
          (s) => s.dayOfWeek !== action.payload
        ),
      };

    case "TOGGLE_SERVICE":
      return {
        ...state,
        services: state.services.includes(action.payload.serviceId)
          ? state.services.filter((id) => id !== action.payload.serviceId)
          : [...state.services, action.payload.serviceId],
      };

    case "SET_CREATED_STAFF_ID":
      return { ...state, createdStaffId: action.payload };

    case "HYDRATE":
      return {
        base: action.payload.base,
        schedules: action.payload.schedules,
        services: action.payload.services,

        originalServices: action.payload.services, // 👈 snapshot inicial

        createdStaffId: action.payload.staffId,
      };

    case "SET_AVATAR":
      return {
        ...state,
        base: {
          ...state.base,
          avatarUrl: action.payload.url,
          avatarPublicId: action.payload.publicId,
        },
      };

    case "CLEAR_AVATAR":
      return {
        ...state,
        base: {
          ...state.base,
          avatarUrl: null,
          avatarPublicId: null,
        },
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

const StaffDraftContext = createContext<any>(null);

export function StaffDraftProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const canSubmit =
    state.base.name && state.base.email && state.schedules.length > 0;

  return (
    <StaffDraftContext.Provider
      value={{
        state,
        dispatch,
        canSubmit,
      }}
    >
      {children}
    </StaffDraftContext.Provider>
  );
}

export function useStaffDraft() {
  const ctx = useContext(StaffDraftContext);
  if (!ctx) {
    throw new Error("useStaffDraft must be used within StaffDraftProvider");
  }
  return ctx;
}
