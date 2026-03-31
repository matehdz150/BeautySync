// core/ports/coupon.repository.ts

import { Coupon } from '../entities/coupon.entity';

export interface CreateCouponInput {
  branchId: string;
  code: string;

  type: 'percentage' | 'fixed';
  value: number;

  minAmountCents?: number;
  maxDiscountCents?: number;

  usageLimit?: number;

  assignedToUserId?: string | null;

  serviceIds?: string[];

  expiresAt?: Date | null;
}

export interface CouponRepository {
  create(data: CreateCouponInput): Promise<Coupon>;

  findById(id: string): Promise<Coupon | null>;

  findByCode(code: string, branchId: string): Promise<Coupon | null>;

  findByBranch(branchId: string): Promise<Coupon[]>;

  update(id: string, data: Partial<Coupon>): Promise<Coupon>;

  incrementUsage(id: string): Promise<void>;

  getServices(couponId: string): Promise<string[]>;

  assignServices(couponId: string, serviceIds: string[]): Promise<void>;
}
