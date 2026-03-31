// infrastructure/adapters/drizzle-coupon.repository.ts

import { Injectable } from '@nestjs/common';
import { db } from 'src/modules/db/client'; // ajusta a tu path
import { coupons, couponServices } from 'src/modules/db/schema';
import * as schema from 'src/modules/db/schema';

import {
  CouponRepository,
  CreateCouponInput,
} from '../../core/ports/coupon.repository';

import { Coupon } from '../../core/entities/coupon.entity';
import { eq, and, sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

type DbCoupon = typeof coupons.$inferSelect;
type DbExecutor = PostgresJsDatabase<typeof schema>;

@Injectable()
export class DrizzleCouponRepository implements CouponRepository {
  async create(data: CreateCouponInput): Promise<Coupon> {
    const [row] = await db
      .insert(coupons)
      .values({
        branchId: data.branchId,
        code: data.code,

        type: data.type,
        value: data.value,

        minAmountCents: data.minAmountCents ?? null,
        maxDiscountCents: data.maxDiscountCents ?? null,

        usageLimit: data.usageLimit ?? null,

        assignedToUserId: data.assignedToUserId ?? null,

        expiresAt: data.expiresAt ?? null,
      })
      .returning();

    return this.map(row);
  }

  async findById(id: string): Promise<Coupon | null> {
    const [row] = await db.select().from(coupons).where(eq(coupons.id, id));

    return row ? this.map(row) : null;
  }

  async findByCode(code: string, branchId: string): Promise<Coupon | null> {
    const [row] = await db
      .select()
      .from(coupons)
      .where(and(eq(coupons.code, code), eq(coupons.branchId, branchId)));

    return row ? this.map(row) : null;
  }

  async findByBranch(branchId: string): Promise<Coupon[]> {
    const rows = await db
      .select()
      .from(coupons)
      .where(eq(coupons.branchId, branchId));

    return rows.map((row) => this.map(row));
  }

  async update(id: string, data: Partial<Coupon>): Promise<Coupon> {
    const [row] = await db
      .update(coupons)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(coupons.id, id))
      .returning();

    return this.map(row);
  }

  async incrementUsage(id: string, tx?: DbExecutor): Promise<void> {
    const executor: DbExecutor = tx ?? db;

    await executor
      .update(coupons)
      .set({
        usedCount: sql`${coupons.usedCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(coupons.id, id));
  }

  private map = (row: DbCoupon): Coupon => {
    return new Coupon(
      row.id,
      row.branchId,
      row.code,

      row.type,
      row.value,

      row.minAmountCents ?? null,
      row.maxDiscountCents ?? null,

      row.usageLimit ?? null,
      row.usedCount,

      row.assignedToUserId ?? null,

      row.expiresAt ?? null,

      row.isActive,

      row.createdAt,
      row.updatedAt,
    );
  };

  async assignServices(couponId: string, serviceIds: string[]) {
    if (!serviceIds.length) return;

    await db.insert(couponServices).values(
      serviceIds.map((serviceId) => ({
        couponId,
        serviceId,
      })),
    );
  }

  async getServices(couponId: string): Promise<string[]> {
    const rows = await db
      .select({ serviceId: couponServices.serviceId })
      .from(couponServices)
      .where(eq(couponServices.couponId, couponId));

    return rows.map((r) => r.serviceId);
  }
}
