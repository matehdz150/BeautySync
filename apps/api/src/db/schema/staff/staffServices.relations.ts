import { relations } from 'drizzle-orm';
import { staff } from './staff';
import { services, staffServices } from '../services';

export const staffServicesRelations = relations(staffServices, ({ one }) => ({
  staff: one(staff, {
    fields: [staffServices.staffId],
    references: [staff.id],
  }),

  service: one(services, {
    fields: [staffServices.serviceId],
    references: [services.id],
  }),
}));
