// conversations.relations.ts
import { relations } from 'drizzle-orm';
import { conversations } from './conversations';
import { publicBookings } from '../public/public-bookings';

export const conversationsRelations = relations(conversations, ({ one }) => ({
  booking: one(publicBookings, {
    fields: [conversations.bookingId],
    references: [publicBookings.id],
  }),
}));
