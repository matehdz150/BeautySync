"use client";

import { createContext, useContext, useReducer } from "react";

export type Service = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
  category?: { id: string; name: string; colorHex: string } | null;
};

export type SelectedService = {
  service: Service;
  staffId?: string;
  staffName?: string;
  startISO?: string;
};

export type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
};

type State = {
  services: SelectedService[];
  client?: Client;
};

type Action =
  | { type: "ADD_SERVICE"; payload: { service: Service; staffId?: string; staffName?: string; startISO?: string } }
  | { type: "UPDATE_STAFF"; payload: { serviceId: string; staffId: string; staffName: string } }
  | { type: "UPDATE_START"; payload: { serviceId: string; startISO: string } }
  | { type: "REMOVE_SERVICE"; payload: { serviceId: string } }
  | { type: "SET_CLIENT"; payload?: Client }
  | { type: "CLEAR" };

const initialState: State = {
  services: [],
  client: undefined,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_SERVICE":
      return {
        ...state,
        services: [
          ...state.services,
          {
            service: action.payload.service,
            staffId: action.payload.staffId,
            staffName: action.payload.staffName,
            startISO: action.payload.startISO,
          },
        ],
      };

    case "UPDATE_STAFF":
      return {
        ...state,
        services: state.services.map((s) =>
          s.service.id === action.payload.serviceId
            ? {
                ...s,
                staffId: action.payload.staffId,
                staffName: action.payload.staffName,
              }
            : s
        ),
      };

    case "UPDATE_START":
      return {
        ...state,
        services: state.services.map((s) =>
          s.service.id === action.payload.serviceId
            ? { ...s, startISO: action.payload.startISO }
            : s
        ),
      };

    case "REMOVE_SERVICE":
      return {
        ...state,
        services: state.services.filter((s) => s.service.id !== action.payload.serviceId),
      };

    case "SET_CLIENT":
      return { ...state, client: action.payload };

    case "CLEAR":
      return { services: [], client: undefined };

    default:
      return state;
  }
}

type Ctx = {
  services: SelectedService[];
  client?: Client;

  addService: (
    s: Service,
    opts?: { staffId?: string; staffName?: string; startISO?: string }
  ) => void;

  updateStaff: (serviceId: string, staffId: string, staffName: string) => void;

  updateStartISO: (serviceId: string, iso: string) => void;

  removeService: (serviceId: string) => void;

  setClient: (c?: Client) => void;

  clear: () => void;
};

const CtxObj = createContext<Ctx | null>(null);

export function AppointmentBuilderProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <CtxObj.Provider
      value={{
        services: state.services,
        client: state.client,

        addService(service, opts) {
          dispatch({
            type: "ADD_SERVICE",
            payload: {
              service,
              staffId: opts?.staffId,
              staffName: opts?.staffName,
              startISO: opts?.startISO,
            },
          });
        },

        updateStaff(serviceId, staffId, staffName) {
          dispatch({
            type: "UPDATE_STAFF",
            payload: { serviceId, staffId, staffName },
          });
        },

        updateStartISO(serviceId, iso) {
          dispatch({
            type: "UPDATE_START",
            payload: { serviceId, startISO: iso },
          });
        },

        removeService(serviceId) {
          dispatch({ type: "REMOVE_SERVICE", payload: { serviceId } });
        },

        setClient(c) {
          dispatch({ type: "SET_CLIENT", payload: c });
        },

        clear() {
          dispatch({ type: "CLEAR" });
        },
      }}
    >
      {children}
    </CtxObj.Provider>
  );
}

export function useAppointmentBuilder() {
  const ctx = useContext(CtxObj);
  if (!ctx) throw new Error("useAppointmentBuilder must be used inside AppointmentBuilderProvider");
  return ctx;
}