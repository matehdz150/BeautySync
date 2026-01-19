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
   PAYMENT ITEM
===================== */

export type PaymentItemInput = {
  type: PaymentItemType;
  referenceId?: string | null;
  label: string;
  amountCents: number; // +cargo | -descuento
  staffId?: string | null;
  meta?: Record<string, any>;
};

export type CreatePaymentInput = {
  organizationId: string;
  branchId: string;

  clientId?: string | null;
  appointmentId?: string | null;

  cashierStaffId: string;

  paymentMethod: PaymentMethod;
  paymentProvider?: string | null;
  externalReference?: string | null;

  notes?: string | null;

  items: PaymentItemInput[];
};

export type Payment = {
  id: string;

  organizationId: string;
  branchId: string;

  clientId?: string | null;
  appointmentId?: string | null;

  cashierStaffId: string;

  paymentMethod: PaymentMethod;
  paymentProvider?: string | null;
  externalReference?: string | null;

  status: PaymentStatus;

  subtotalCents: number;
  discountsCents: number;
  taxCents: number;
  totalCents: number;

  notes?: string | null;

  createdAt: string;
  paidAt?: string | null;
};

export async function createPayment(input: CreatePaymentInput) {
  return api<Payment>("/payments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getPaymentById(id: string) {
  return api<Payment>(`/payments/${id}`);
}

export type ListPaymentsParams = {
  branchId: string;

  clientId?: string;
  appointmentId?: string;
  cashierStaffId?: string;
  status?: PaymentStatus;

  from?: string; // ISO date
  to?: string;   // ISO date

  limit?: number;
  offset?: number;
};

export async function listPayments(params: ListPaymentsParams) {
  return api<{
    total: number;
    data: Payment[];
  }>(`/payments?${new URLSearchParams(params as any)}`);
}

export async function getPaymentsByAppointment(appointmentId: string) {
  return api<Payment[]>(`/payments/by-appointment/${appointmentId}`);
}

export async function getPaymentsByClient(clientId: string) {
  return api<Payment[]>(`/payments/client/${clientId}`);
}