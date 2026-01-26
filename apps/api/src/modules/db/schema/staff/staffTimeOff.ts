/* eslint-disable prettier/prettier */
import {
  pgTable,
  serial,
  uuid,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { staff } from "./staff";

export const staffTimeOff = pgTable(
  "staff_time_off",
  {
    id: serial("id").primaryKey(),

    staffId: uuid("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),

    start: timestamp("start", { withTimezone: true }).notNull(),
    end: timestamp("end", { withTimezone: true }).notNull(),

    reason: text("reason"),
  },

  (table) => ({
    // 🔥 más frecuente — time off por staff
    timeoffStaffIdx: index("staff_timeoff_staff_idx").on(table.staffId),

    // ⚡ útil para rangos de fecha
    timeoffStartIdx: index("staff_timeoff_start_idx").on(table.start),

    // 📅 reportes por fecha
    timeoffEndIdx: index("staff_timeoff_end_idx").on(table.end),
  })
);