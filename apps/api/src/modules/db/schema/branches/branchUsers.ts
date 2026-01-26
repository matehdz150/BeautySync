/* eslint-disable prettier/prettier */
import {
  pgTable,
  serial,
  uuid,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { branches } from "./branches";
import { users } from "../users";

export type BranchRole = "OWNER" | "ADMIN" | "STAFF";

export const branchUsers = pgTable(
  "branch_users",
  {
    id: serial("id").primaryKey(),

    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    role: text("role").$type<BranchRole>().notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },

  (table) => ({
    // 🔥 lista de usuarios por sucursal
    branchIdx: index("branch_users_branch_idx").on(table.branchId),

    // 🔥 lista de sucursales por usuario
    userIdx: index("branch_users_user_idx").on(table.userId),

    // ⚡ consultar roles rápido
    roleIdx: index("branch_users_role_idx").on(table.role),
  })
);