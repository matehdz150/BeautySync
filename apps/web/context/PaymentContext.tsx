"use client";

import { assignClientToBooking } from "@/lib/services/appointments";
import {
  openPayment,
  openBookingPayment as openBookingPaymentService,
  addPaymentItems,
  removePaymentItem,
  finalizePayment,
  cancelPayment,
  getPayment,
  Payment as ApiPayment,
  PaymentItem as ApiPaymentItem,
  assignClientToPayment,
} from "@/lib/services/payments";

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
  avatarUrl?: string | null;
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
  type: PaymentItemType;
  amount: number;

  staff?: Staff;
  client?: Client;

  meta?: {
    color?: string;
    icon?: string | null;
    durationMin?: number;
  };
};

export type PaymentState = {
  paymentId?: string;

  staff?: Staff;
  client?: Client;

  bookingId?: string;

  items: PaymentItem[];

  paymentMethod?: PaymentMethod;

  subtotal: number;
  discounts: number;
  total: number;
};

/* =====================================================
ACTIONS
===================================================== */

type PaymentAction =
  | { type: "SET_PAYMENT"; payload: Partial<PaymentState> }
  | { type: "SET_CLIENT"; payload?: Client }
  | { type: "SET_STAFF"; payload: Staff }
  | { type: "SET_PAYMENT_METHOD"; payload: PaymentMethod }
  | { type: "ADD_ITEM_LOCAL"; payload: PaymentItem }
  | { type: "RESET_PAYMENT" };

/* =====================================================
INITIAL
===================================================== */

const initialState: PaymentState = {
  items: [],
  subtotal: 0,
  discounts: 0,
  total: 0,
};

/* =====================================================
REDUCER
===================================================== */

function reducer(state: PaymentState, action: PaymentAction): PaymentState {
  switch (action.type) {
    case "SET_PAYMENT":
      return { ...state, ...action.payload };

    case "SET_CLIENT":
      return { ...state, client: action.payload };

    case "SET_STAFF":
      return { ...state, staff: action.payload };

    case "SET_PAYMENT_METHOD":
      return { ...state, paymentMethod: action.payload };

    case "RESET_PAYMENT":
      return initialState;

    case "ADD_ITEM_LOCAL":
      const newItems = [...state.items, action.payload];

      const subtotal = newItems.reduce((acc, i) => acc + i.amount, 0);

      return {
        ...state,
        items: newItems,
        subtotal,
        total: subtotal - state.discounts,
      };

    default:
      return state;
  }
}

/* =====================================================
CONTEXT
===================================================== */

type Ctx = {
  state: PaymentState;

  openPOSPayment: (params: {
    organizationId: string;
    branchId: string;
  }) => Promise<void>;

  openBookingPayment: (params: {
    organizationId: string;
    branchId: string;
    bookingId: string;
  }) => Promise<ApiPayment>;

  addItem: (item: PaymentItem) => Promise<void>;

  removeItem: (itemId: string) => Promise<void>;

  finalize: () => Promise<void>;

  cancel: () => Promise<void>;

  setClient: (client?: Client) => void;

  setStaff: (staff: Staff) => void;

  setPaymentMethod: (method: PaymentMethod) => void;

  assignClient: (client: Client) => Promise<void>;
};

const PaymentContext = createContext<Ctx | null>(null);

/* =====================================================
PROVIDER
===================================================== */

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  /* =====================================================
  HELPERS
  ===================================================== */

  function getCashierId(): string {
    const raw = localStorage.getItem("user");
    if (!raw) throw new Error("User not found in localStorage");

    return JSON.parse(raw).id;
  }

  function mapItems(items: ApiPaymentItem[]): PaymentItem[] {
    return items.map((item) => ({
      id: item.id,
      label: item.label,
      type: item.type,
      amount: item.amountCents / 100,
      staff: item.staffId ? { id: item.staffId, name: "" } : undefined,
      meta: item.meta,
    }));
  }

  async function refreshPayment(paymentId: string) {
    const payment: ApiPayment = await getPayment(paymentId);

    dispatch({
      type: "SET_PAYMENT",
      payload: {
        items: mapItems(payment.items ?? []),
        subtotal: payment.subtotalCents / 100,
        discounts: payment.discountsCents / 100,
        total: payment.totalCents / 100,
      },
    });
  }

  /* =====================================================
  OPEN POS PAYMENT
  ===================================================== */

  async function openPOSPayment(params: {
    organizationId: string;
    branchId: string;
  }) {
    const payment = await openPayment({
      organizationId: params.organizationId,
      branchId: params.branchId,
      cashierStaffId: getCashierId(),
    });

    dispatch({
      type: "SET_PAYMENT",
      payload: {
        paymentId: payment.id,
        items: mapItems(payment.items ?? []),
        subtotal: payment.subtotalCents / 100,
        discounts: payment.discountsCents / 100,
        total: payment.totalCents / 100,
      },
    });
  }

  /* =====================================================
OPEN BOOKING PAYMENT
===================================================== */

  async function openBookingPaymentAction(params: {
    organizationId: string;
    branchId: string;
    bookingId: string;
  }) {
    const payment = await openBookingPaymentService({
      organizationId: params.organizationId,
      branchId: params.branchId,
      bookingId: params.bookingId,
      cashierStaffId: getCashierId(),
    });

    // 🔎 DEBUG mínimo
    console.log("💳 openBookingPaymentService response:", payment);

    dispatch({
      type: "SET_PAYMENT",
      payload: {
        paymentId: payment.id,
        bookingId: params.bookingId,

        // 👇 cliente que viene del backend
        client: payment.client
          ? {
              id: payment.client.id,
              name: payment.client.name,
              email: payment.client.email ?? undefined,
              phone: payment.client.phone ?? null,
              avatarUrl: payment.client.avatarUrl ?? null,
            }
          : undefined,

        items: mapItems(payment.items ?? []),
        subtotal: payment.subtotalCents / 100,
        discounts: payment.discountsCents / 100,
        total: payment.totalCents / 100,
      },
    });

    return payment;
  }

  /* =====================================================
  ADD ITEM
  ===================================================== */

  async function addItem(item: PaymentItem) {
    console.log("🛒 addItem called:", item);

    dispatch({ type: "ADD_ITEM_LOCAL", payload: item });

    let paymentId = state.paymentId;

    console.log("💳 current paymentId:", paymentId);

    if (!paymentId) {
      console.log("⚠️ No paymentId found, creating new payment...");

      const rawBranch = localStorage.getItem("branch");
      if (!rawBranch) throw new Error("Branch missing");

      const branch = JSON.parse(rawBranch);

      console.log("🏪 branch:", branch);

      const payment = await openPayment({
        organizationId: branch.organizationId,
        branchId: branch.id,
        cashierStaffId: getCashierId(),
      });

      console.log("✅ payment created:", payment);

      paymentId = payment.id;

      dispatch({
        type: "SET_PAYMENT",
        payload: { paymentId },
      });

      console.log("📦 paymentId stored in state:", paymentId);
    }

    console.log("➕ adding item to payment:", paymentId);

    await addPaymentItems(paymentId!, {
      items: [
        {
          type: item.type,
          label: item.label,
          amountCents: Math.round(item.amount * 100),
          referenceId: item.id,
          staffId: item.staff?.id,
          meta: item.meta,
        },
      ],
    });

    console.log("🔄 refreshing payment:", paymentId);

    await refreshPayment(paymentId!);

    console.log("✅ payment refreshed");
  }

  /* =====================================================
  REMOVE ITEM
  ===================================================== */

  async function removeItem(itemId: string) {
    if (!state.paymentId) return;

    await removePaymentItem(state.paymentId, itemId);

    await refreshPayment(state.paymentId);
  }

  /* =====================================================
  FINALIZE
  ===================================================== */

  async function finalize() {
    if (!state.paymentId || !state.paymentMethod) return;

    const res = await finalizePayment(state.paymentId, state.paymentMethod);

    console.log("💳 finalizePayment response:", res);

    dispatch({ type: "RESET_PAYMENT" });
  }

  /* =====================================================
  CANCEL
  ===================================================== */

  async function cancel() {
    if (!state.paymentId) return;

    await cancelPayment(state.paymentId);

    dispatch({ type: "RESET_PAYMENT" });
  }

  async function assignClient(client: Client) {
    if (!state.paymentId) return;

    /* ======================
     CASE 1: BOOKING
  ====================== */

    if (state.bookingId) {
      if (!state.client) {
        await assignClientToBooking({
          bookingId: state.bookingId,
          clientId: client.id,
        });
      }
    } else {

    /* ======================
     CASE 2: POS PAYMENT
  ====================== */
      await assignClientToPayment({
        paymentId: state.paymentId,
        clientId: client.id,
      });
    }

    dispatch({
      type: "SET_CLIENT",
      payload: client,
    });
  }

  /* =====================================================
  SETTERS
  ===================================================== */

  function setClient(client?: Client) {
    dispatch({ type: "SET_CLIENT", payload: client });
  }

  function setStaff(staff: Staff) {
    dispatch({ type: "SET_STAFF", payload: staff });
  }

  function setPaymentMethod(method: PaymentMethod) {
    dispatch({ type: "SET_PAYMENT_METHOD", payload: method });
  }

  return (
    <PaymentContext.Provider
      value={{
        state,
        openPOSPayment,
        openBookingPayment: openBookingPaymentAction,
        addItem,
        removeItem,
        finalize,
        cancel,
        setClient,
        setStaff,
        setPaymentMethod,
        assignClient
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
