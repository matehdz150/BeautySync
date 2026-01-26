/* eslint-disable prettier/prettier */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    name: text("name").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },

  (table) => ({
    // 🔍 para buscar / autocompletar por nombre
    orgNameIdx: index("organization_name_idx").on(table.name),
  })
);