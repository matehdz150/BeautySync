import { relations } from 'drizzle-orm';
import { branches } from './branches';
import { branchImages } from './branchImages';

export const branchesRelations = relations(branches, ({ many }) => ({
  images: many(branchImages),
}));

export const branchImagesRelations = relations(branchImages, ({ one }) => ({
  branch: one(branches, {
    fields: [branchImages.branchId],
    references: [branches.id],
  }),
}));
