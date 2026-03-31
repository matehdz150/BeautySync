// drizzle/schema/coupon-services.ts
import { pgTable, uuid, uniqueIndex } from 'drizzle-orm/pg-core';
import { coupons } from './cupon';
import { services } from '../services';

export const couponServices = pgTable(
  'coupon_services',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    couponId: uuid('coupon_id')
      .notNull()
      .references(() => coupons.id, { onDelete: 'cascade' }),

    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    uniqueIdx: uniqueIndex('coupon_service_unique').on(
      table.couponId,
      table.serviceId,
    ),
  }),
);
