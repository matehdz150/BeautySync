/* eslint-disable prettier/prettier */
import {
  pgTable,
  uuid,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { appointments } from "../appointments";
import { users } from "../users";
import { clients } from "../clients";

export type NotificationType = "EMAIL" | "SMS" | "PUSH";
export type NotificationStatus = "QUEUED" | "SENT" | "FAILED";

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),

  appointmentId: uuid("appointment_id")
    .references(() => appointments.id, { onDelete: "cascade" }),

  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "set null" }),

  clientId: uuid("client_id")
    .references(() => clients.id, { onDelete: "set null" }),

  type: text("type").$type<NotificationType>().notNull(),   // email / sms / push

  template: text("template"),                               // ej: "REMINDER_24H"

  status: text("status").$type<NotificationStatus>().default("QUEUED"),

  providerMessageId: text("provider_message_id"),           // Twilio / Resend / etc

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});