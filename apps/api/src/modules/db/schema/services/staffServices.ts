/* eslint-disable prettier/prettier */
import {
  pgTable,
  uuid,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { staff } from "../staff/staff";
import { services } from "./service";


export const staffServices = pgTable(
  "staff_services",
  {
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),

    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
  },

  (table) => ({
    pk: primaryKey({ columns: [table.staffId, table.serviceId] }),

    staffIdx: index("staff_service_staff_idx").on(table.staffId),

    serviceIdx: index("staff_service_service_idx").on(table.serviceId),
  })
);