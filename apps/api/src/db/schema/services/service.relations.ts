import { relations } from 'drizzle-orm';
import { services } from './service';
import { serviceCategories } from './serviceCategories';
import { staffServices } from './staffServices';
import { branches } from '../branches';
import { organizations } from '../organizations';

export const serviceRelations = relations(services, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [services.organizationId],
    references: [organizations.id],
  }),
  branch: one(branches, {
    fields: [services.branchId],
    references: [branches.id],
  }),
  category: one(serviceCategories, {
    fields: [services.categoryId],
    references: [serviceCategories.id],
  }),
  staff: many(staffServices),
}));
