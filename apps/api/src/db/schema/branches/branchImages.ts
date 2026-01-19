import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { branches } from './branches';

export const branchImages = pgTable(
  'branch_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'cascade' }),

    url: text('url').notNull(), // URL pública
    publicId: text('public_id').notNull(), // Cloudinary public_id

    isCover: boolean('is_cover').notNull().default(false),
    position: integer('position').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    branchIdx: index('branch_images_branch_idx').on(table.branchId),
  }),
);
