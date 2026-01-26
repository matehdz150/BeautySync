/* eslint-disable prettier/prettier */
import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { branches } from "./branches";

export const branchSettings = pgTable(
  "branch_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),

    timezone: text("timezone").notNull().default("America/Mexico_City"),

    minBookingNoticeMin: integer("min_booking_notice_min").default(0),
    maxBookingAheadDays: integer("max_booking_ahead_days").default(60),
    cancelationWindowMin: integer("cancelation_window_min").default(120),

    bufferBeforeMin: integer("buffer_before_min").default(0),
    bufferAfterMin: integer("buffer_after_min").default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },

  (table) => ({
    branchIdx: index("branch_settings_branch_idx").on(table.branchId),
  })
);