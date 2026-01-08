/* eslint-disable prettier/prettier */
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import { appointments } from "../appointments";
import { branches } from "../branches/branches";
import { clients } from "../clients";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentMethod =
  | "CASH"
  | "CARD"
  | "TRANSFER"
  | "STRIPE"
  | "MERCADO_PAGO";

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    appointmentId: uuid("appointment_id")
      .references(() => appointments.id, { onDelete: "set null" }),

    branchId: uuid("branch_id")
      .references(() => branches.id, { onDelete: "set null" }),

    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "set null" }),

    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("MXN"),

    method: text("method").$type<PaymentMethod>().notNull(),

    status: text("status").$type<PaymentStatus>().default("PENDING"),

    providerPaymentId: text("provider_payment_id"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },

  (table) => ({
    // 🔥 reportes por sucursal y fecha
    paymentBranchDateIdx: index("payment_branch_date_idx").on(
      table.branchId,
      table.createdAt
    ),

    // 🔎 historial de pagos de un cliente
    paymentClientIdx: index("payment_client_idx").on(table.clientId),

    // ⚡ conciliación por estado
    paymentStatusIdx: index("payment_status_idx").on(table.status),

    // 📅 pagos por cita
    paymentAppointmentIdx: index("payment_appointment_idx").on(
      table.appointmentId
    ),
  })
);