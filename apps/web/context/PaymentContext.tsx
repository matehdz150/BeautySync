"use client";

import { createPayment } from "@/lib/services/payments";
import { createContext, ReactNode, useContext, useReducer } from "react";

/* =====================================================
   TYPES
===================================================== */

export type Staff = {
  id: string;
  name: string;
};

export type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string | null;
};

export type PaymentMethod =
  | "card"
  | "cash"
  | "transfer"
  | "gift_card"
  | "terminal"
  | "qr";

export type PaymentItemType =
  | "service"
  | "product"
  | "discount"
  | "fee"
  | "tax";

export type PaymentItem = {
  id: string;
  label: string;
  date?: string;
  duration?: number;
  type: PaymentItemType;
  amount: number; // +cargo | -descuento
  staff?: Staff;
  client?: Client;

  // 👇 UI / metadata (NO afecta cálculos)
  meta?: {
    color?: string;
    icon?: string | null;
    durationMin?: number;
  };
};

export type PaymentState = {
  staff?: Staff; // cajero
  client?: Client;
  items: PaymentItem[];
  paymentMethod?: PaymentMethod;
};

/* =====================================================
   ACTIONS
===================================================== */

export type PaymentAction =
  | { type: "SET_CLIENT"; payload?: Client }
  | { type: "SET_STAFF"; payload: Staff }
  | { type: "ADD_ITEM"; payload: PaymentItem }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "CLEAR_ITEMS" }
  | { type: "SET_PAYMENT_METHOD"; payload: PaymentMethod }
  | { type: "RESET_PAYMENT" };

/* =====================================================
   INITIAL STATE
===================================================== */

const initialState: PaymentState = {
  items: [],
};

/* =====================================================
   REDUCER
===================================================== */

function reducer(state: PaymentState, action: PaymentAction): PaymentState {
  switch (action.type) {
    case "SET_CLIENT":
      return { ...state, client: action.payload };

    case "SET_STAFF":
      return { ...state, staff: action.payload };

    case "ADD_ITEM":
      return { ...state, items: [...state.items, action.payload] };

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.payload.id),
      };

    case "CLEAR_ITEMS":
      return { ...state, items: [] };

    case "SET_PAYMENT_METHOD":
      return { ...state, paymentMethod: action.payload };

    case "RESET_PAYMENT":
      return initialState;

    default:
      return state;
  }
}

/* =====================================================
   SELECTORS
===================================================== */

const getSubtotal = (s: PaymentState) =>
  s.items.filter((i) => i.amount > 0).reduce((a, b) => a + b.amount, 0);

const getDiscounts = (s: PaymentState) =>
  s.items.filter((i) => i.amount < 0).reduce((a, b) => a + b.amount, 0);

const getTotal = (s: PaymentState) => s.items.reduce((a, b) => a + b.amount, 0);

const canSubmit = (s: PaymentState) =>
  s.items.length > 0 && !!s.staff && !!s.paymentMethod;

/* =====================================================
   CONTEXT
===================================================== */

type Ctx = {
  state: PaymentState;
  dispatch: React.Dispatch<PaymentAction>;
  subtotal: number;
  discounts: number;
  total: number;
  canSubmit: boolean;
  submitPayment: (params: {
    organizationId: string;
    branchId: string;
    appointmentId?: string;
    notes?: string;
  }) => Promise<void>;
};

const PaymentContext = createContext<Ctx | null>(null);

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  async function submitPayment(params: {
    organizationId: string;
    branchId: string;
    appointmentId?: string;
    notes?: string;
  }) {
    if (!canSubmit(state)) {
      throw new Error("Payment is not ready to submit");
    }

    const userRaw = localStorage.getItem("user");

    const user = userRaw ? JSON.parse(userRaw) : null;

    const email = user?.id;

    await createPayment({
      organizationId: params.organizationId,
      branchId: params.branchId,

      clientId: state.client?.id ?? null,
      appointmentId: params.appointmentId ?? null,

      cashierStaffId: email,
      paymentMethod: state.paymentMethod!,

      notes: params.notes,

      items: state.items.map((item) => ({
        type: item.type,
        referenceId: item.id,
        label: item.label,
        amountCents: Math.round(item.amount * 100),
        staffId: item.staff?.id ?? null,
        meta: item.meta,
      })),
    });

    // 👉 opcional: limpiar estado después de pagar
    dispatch({ type: "RESET_PAYMENT" });
  }

  return (
    <PaymentContext.Provider
      value={{
        state,
        dispatch,
        subtotal: getSubtotal(state),
        discounts: getDiscounts(state),
        total: getTotal(state),
        canSubmit: canSubmit(state),
        submitPayment,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const ctx = useContext(PaymentContext);
  if (!ctx) {
    throw new Error("usePayment must be used within PaymentProvider");
  }
  return ctx;
}
