/* eslint-disable prettier/prettier */
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { organizations } from "../organizations";
import { serviceCategories } from "./serviceCategories";
import { branches } from "../branches";

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    categoryId: uuid("category_id").references(() => serviceCategories.id, {
      onDelete: "set null",
    }),

    branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    description: text("description"),

    durationMin: integer("duration_min").notNull(),
    priceCents: integer("price_cents"),
    notes: jsonb("notes").$type<string[]>().default([]),
    serviceRules: jsonb("service_rules").$type<string[]>().default([]),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },

  (table) => ({
    orgIdx: index("service_org_idx").on(table.organizationId),
    categoryIdx: index("service_category_idx").on(table.categoryId),
    activeIdx: index("service_active_idx").on(table.isActive),
    nameIdx: index("service_name_idx").on(table.name),
  })
);