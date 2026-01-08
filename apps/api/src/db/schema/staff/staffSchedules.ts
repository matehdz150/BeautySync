/* eslint-disable prettier/prettier */
import {
  pgTable,
  serial,
  uuid,
  integer,
  time,
  index,
} from "drizzle-orm/pg-core";
import { staff } from "./staff";
import { relations } from "drizzle-orm";

export const staffSchedules = pgTable(
  "staff_schedules",
  {
    id: serial("id").primaryKey(),

    staffId: uuid("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),

    // 0 = Sunday, 1 = Monday ...
    dayOfWeek: integer("day_of_week").notNull(),

    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
  },

  (table) => ({
    // 🔥 el más usado
    scheduleStaffIdx: index("staff_schedule_staff_idx").on(table.staffId),

    // ⚡ disponibilidad por día
    scheduleStaffDayIdx: index("staff_schedule_staff_day_idx").on(
      table.staffId,
      table.dayOfWeek
    ),
  })
);

export const staffSchedulesRelations = relations(
  staffSchedules,
  ({ one }) => ({
    staff: one(staff, {
      fields: [staffSchedules.staffId],
      references: [staff.id],
    }),
  }),
);