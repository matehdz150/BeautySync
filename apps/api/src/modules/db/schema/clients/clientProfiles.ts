/* eslint-disable prettier/prettier */
import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { staff } from "../staff/staff";

export const clientProfiles = pgTable(
  "client_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),

    gender: text("gender"),
    occupation: text("occupation"),
    city: text("city"),
    ageRange: text("age_range"),

    preferredStaffId: uuid("preferred_staff_id")
      .references(() => staff.id, { onDelete: "set null" }),

    marketingOptIn: boolean("marketing_opt_in").default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },

  (table) => ({
    // 🔥 lookup directo del perfil del cliente
    profileClientIdx: index("client_profile_client_idx").on(table.clientId),

    // ❤️ campañas de marketing
    marketingIdx: index("client_profile_marketing_idx").on(
      table.marketingOptIn
    ),

    // 📊 analytics comunes
    genderIdx: index("client_profile_gender_idx").on(table.gender),
    cityIdx: index("client_profile_city_idx").on(table.city),
  })
);