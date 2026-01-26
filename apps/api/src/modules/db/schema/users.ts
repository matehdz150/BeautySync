/* eslint-disable prettier/prettier */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    email: text("email").notNull().unique(),

    passwordHash: text("password_hash").notNull(),

    name: text("name"),

    avatarUrl: text("avatar_url"),

    organizationId: uuid("organization_id"),

    role: text("role").notNull().default("manager"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },

  (table) => ({
    userEmailIdx: index("user_email_idx").on(table.email),
    userOrgIdx: index("user_org_idx").on(table.organizationId),
    userCreatedIdx: index("user_created_idx").on(table.createdAt),
  })
);