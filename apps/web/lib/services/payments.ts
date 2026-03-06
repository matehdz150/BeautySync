import { api } from "./api";

/* =====================
   ENUMS
===================== */

export type PaymentMethod =
  | "cash"
  | "card"
  | "terminal"
  | "transfer"
  | "qr"
  | "gift_card";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled";

export type PaymentItemType =
  | "service"
  | "product"
  | "discount"
  | "fee"
  | "tax";

/* =====================
   CLIENT
===================== */

export type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
};

/* =====================
   PAYMENT ITEM
===================== */

export type PaymentItemInput = {
  type: PaymentItemType;
  label: string;
  amountCents: number;
  referenceId?: string | null;
  staffId?: string | null;
  meta?: Record<string, any>;
};

export type PaymentItem = {
  id: string;
  paymentId: string;

  type: PaymentItemType;
  label: string;
  amountCents: number;

  referenceId?: string | null;
  staffId?: string | null;

  meta?: Record<string, any>;
};

/* =====================
   PAYMENT
===================== */

export type Payment = {
  id: string;

  organizationId: string;
  branchId: string;

  bookingId?: string | null;

  clientId?: string | null;

  client?: Client | null;

  cashierStaffId: string;

  status: PaymentStatus;

  paymentMethod?: PaymentMethod | null;
  paymentProvider?: string | null;
  externalReference?: string | null;
  notes?: string | null;

  subtotalCents: number;
  discountsCents: number;
  taxCents: number;
  totalCents: number;

  createdAt: string;
  paidAt?: string | null;

  items?: PaymentItem[];
};

/* =====================
   OPEN PAYMENT (POS)
===================== */

export type OpenPaymentInput = {
  organizationId: string;
  branchId: string;

  clientId?: string | null;

  cashierStaffId: string;
};

export async function openPayment(input: OpenPaymentInput) {
  return api<Payment>("/payments/open", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/* =====================
   OPEN BOOKING PAYMENT
===================== */

export type OpenBookingPaymentInput = {
  organizationId: string;
  branchId: string;

  bookingId: string;
  clientId?: string | null;

  cashierStaffId: string;
};

export async function openBookingPayment(input: OpenBookingPaymentInput) {
  return api<Payment>("/payments/open-booking", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/* =====================
   ADD ITEMS
===================== */

export type AddPaymentItemsInput = {
  items: PaymentItemInput[];
};

export async function addPaymentItems(
  paymentId: string,
  input: AddPaymentItemsInput
) {
  return api(`/payments/${paymentId}/items`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/* =====================
   REMOVE ITEM
===================== */

export async function removePaymentItem(
  paymentId: string,
  itemId: string
) {
  return api(`/payments/${paymentId}/items/${itemId}`, {
    method: "DELETE",
  });
}

export async function finalizePayment(
  paymentId: string,
  method: PaymentMethod
) {
  return api(`/payments/${paymentId}/finalize`, {
    method: "POST",
    body: JSON.stringify({
      method,
    }),
  });
}

/* =====================
   CANCEL PAYMENT
===================== */

export async function cancelPayment(paymentId: string) {
  return api(`/payments/${paymentId}/cancel`, {
    method: "POST",
  });
}

/* =====================
   GET PAYMENT
===================== */

export async function getPayment(paymentId: string) {
  return api<Payment>(`/payments/${paymentId}`);
}

export type AssignPaymentClientResponse = {
  success: boolean;
};

export async function assignClientToPayment(params: {
  paymentId: string;
  clientId: string;
}): Promise<AssignPaymentClientResponse> {
  const { paymentId, clientId } = params;

  if (!paymentId) {
    throw new Error("paymentId is required");
  }

  if (!clientId) {
    throw new Error("clientId is required");
  }

  return api<AssignPaymentClientResponse>(
    `/payments/${paymentId}/assign-client`,
    {
      method: "POST",
      body: JSON.stringify({
        clientId,
      }),
    }
  );
}

/* =====================
   CLIENT PAYMENT DETAILS
===================== */

export type BookingAppointment = {
  id: string;
  start: string;
  end: string;
  priceCents: number;

  service: {
    id: string;
    name: string;
    durationMin: number;
  };

  staff: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
};

export type Booking = {
  id: string;

  branchId: string;

  startsAt: string;
  endsAt: string;

  status: string;

  paymentMethod: string;

  totalCents: number;

  notes?: string | null;

  appointments: BookingAppointment[];
};

export type ClientPaymentDetails = {
  payment: Payment;
  items: PaymentItem[];

  booking?: Booking | null;
};

/* =====================
   GET CLIENT PAYMENTS
===================== */

export async function getClientPayments(clientId: string) {
  if (!clientId) {
    throw new Error("clientId is required");
  }

  return api<ClientPaymentDetails[]>(`/payments/client/${clientId}`);
}