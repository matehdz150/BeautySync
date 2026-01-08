/* eslint-disable prettier/prettier */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";


export const serviceCategories = pgTable(
  "service_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    name: text("name").notNull(),

    icon: text("icon").notNull(),

    colorHex: text("color_hex").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    nameIdx: index("service_category_name_idx").on(table.name),
    nameUniqueIdx: uniqueIndex("service_category_name_unique_idx").on(table.name)
  })
);