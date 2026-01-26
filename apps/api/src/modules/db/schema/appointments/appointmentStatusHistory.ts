/* eslint-disable prettier/prettier */
import {
  pgTable,
  serial,
  uuid,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import { appointments } from "./appointments";
import { users } from "../users";

export const appointmentStatusHistory = pgTable(
  "appointment_status_history",
  {
    id: serial("id").primaryKey(),

    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),

    oldStatus: text("old_status"),
    newStatus: text("new_status").notNull(),

    changedByUserId: uuid("changed_by_user_id")
      .references(() => users.id, { onDelete: "set null" }),

    reason: text("reason"),

    changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow(),
  },

  (table) => ({
    // 🔥 historial de una cita
    historyApptIdx: index("appointment_history_appt_idx").on(
      table.appointmentId,
      table.changedAt
    ),

    // 🔍 debugging / auditoría
    historyUserIdx: index("appointment_history_user_idx").on(
      table.changedByUserId
    ),
  })
);