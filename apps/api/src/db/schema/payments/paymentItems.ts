/* eslint-disable prettier/prettier */
import {
  pgTable,
  uuid,
  text,
  integer,
  index,
} from "drizzle-orm/pg-core";

import { payments } from "./payment";
import { services } from "../services";

export type PaymentItemType = "SERVICE" | "TAX" | "DISCOUNT" | "TIP";

export const paymentItems = pgTable(
  "payment_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),

    serviceId: uuid("service_id")
      .references(() => services.id, { onDelete: "set null" }),

    description: text("description"),

    type: text("type").$type<PaymentItemType>().notNull(),

    amountCents: integer("amount_cents").notNull(),
  },

  (table) => ({
    // 🔥 lookup por pago
    itemPaymentIdx: index("payment_item_payment_idx").on(table.paymentId),

    // 📊 ingresos por servicio
    itemServiceIdx: index("payment_item_service_idx").on(table.serviceId),

    // 💸 agregados por tipo (propinas, descuentos)
    itemTypeIdx: index("payment_item_type_idx").on(table.type),
  })
);