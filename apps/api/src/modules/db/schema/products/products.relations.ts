import { relations } from 'drizzle-orm';
import { branches } from '../branches';
import { products } from './products';

export const productsRelations = relations(products, ({ one }) => ({
  branch: one(branches, {
    fields: [products.branchId],
    references: [branches.id],
  }),
}));
