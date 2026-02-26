// publicBookings.relations.ts
import { relations } from 'drizzle-orm';
import { publicBookings } from './public-bookings';
import { branches } from '../branches/branches';
import { appointments } from '../appointments/appointments';

export const publicBookingsRelations = relations(
  publicBookings,
  ({ one, many }) => ({
    branch: one(branches, {
      fields: [publicBookings.branchId],
      references: [branches.id],
    }),

    appointments: many(appointments),
  }),
);
