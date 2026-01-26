/* eslint-disable prettier/prettier */
import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { branches } from "../branches/branches";
import { users } from "../users";

// 👇 Enum de estado del staff
export const staffStatusEnum = pgEnum("staff_status", [
  "pending",   // creado pero no ha aceptado invitación
  "active",    // ya tiene cuenta y usa el sistema
  "disabled",  // lo dieron de baja
]);

export const staff = pgTable(
  "staff",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),

    // Nullable: antes de aceptar invitación puede no tener user
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    name: text("name").notNull(),

    // 👇 Nuevo: email del staff (lo usaremos para invites)
    // Lo dejo nullable para que la migración no truene si ya tienes filas.
    email: text("email"),

    phone: text("phone"),

    avatarUrl: text("avatar_url"),

    // Estado lógico de onboarding / ciclo de vida
    status: staffStatusEnum("status").notNull().default("pending"),

    jobRole: text("jobRole"),

    // Flag rápido para filtrar en UI (lo mantenemos)
    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },

  (table) => ({
    // 🔥 listar staff por sucursal
    staffBranchIdx: index("staff_branch_idx").on(table.branchId),

    // ⚡ staff activos (flag)
    staffActiveIdx: index("staff_active_idx").on(table.isActive),

    // 👤 lookup si staff está ligado a usuario login
    staffUserIdx: index("staff_user_idx").on(table.userId),

    // ❗ Evitar duplicar staff por sucursal + email
    staffBranchEmailUnique: uniqueIndex("staff_branch_email_unq").on(
      table.branchId,
      table.email,
    ),
  }),
);