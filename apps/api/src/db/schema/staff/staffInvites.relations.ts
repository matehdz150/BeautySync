import { relations } from 'drizzle-orm';
import { staffInvites } from './staffInvites';
import { staff } from './staff';

export const inviteRelations = relations(staffInvites, ({ one }) => ({
  staff: one(staff, {
    fields: [staffInvites.staffId],
    references: [staff.id],
  }),
}));
