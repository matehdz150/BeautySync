/* eslint-disable prettier/prettier */
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import { payments } from "./payment";

export const refunds = pgTable(
  "refunds",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),

    amountCents: integer("amount_cents").notNull(),

    currency: text("currency").notNull().default("MXN"),

    reason: text("reason"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },

  (table) => ({
    // 🔥 todos los reembolsos de un pago
    refundPaymentIdx: index("refund_payment_idx").on(table.paymentId),

    // 📅 reportes financieros por fecha
    refundDateIdx: index("refund_date_idx").on(table.createdAt),
  })
);