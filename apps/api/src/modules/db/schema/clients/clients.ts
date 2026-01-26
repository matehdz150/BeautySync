/* eslint-disable prettier/prettier */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  index,
} from "drizzle-orm/pg-core";
import { organizations } from "../organizations";

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    avatarUrl: text("avatar_url"),

    birthdate: date("birthdate"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },

  (table) => ({
    // 🔥 buscar clientes dentro de una organización
    clientOrgIdx: index("client_org_idx").on(table.organizationId),

    // 🔍 búsqueda por email
    clientEmailIdx: index("client_email_idx").on(table.email),

    // 📞 búsqueda por teléfono
    clientPhoneIdx: index("client_phone_idx").on(table.phone),
  })
);