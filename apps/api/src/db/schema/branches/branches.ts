/* eslint-disable prettier/prettier */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { organizations } from "../organizations";

export const branches = pgTable(
  "branches",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    address: text("address"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },

  (table) => ({
    // 🔥 consultas por organización
    orgIdx: index("branch_org_idx").on(table.organizationId),

    // 🔎 ayuda si buscas por nombre
    nameIdx: index("branch_name_idx").on(table.name),
  })
);