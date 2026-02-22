// publicBookings.relations.ts
import { relations } from 'drizzle-orm';
import { publicBookings } from './public-bookings';
import { branches } from '../branches/branches';

export const publicBookingsRelations = relations(publicBookings, ({ one }) => ({
  branch: one(branches, {
    fields: [publicBookings.branchId],
    references: [branches.id],
  }),
}));
