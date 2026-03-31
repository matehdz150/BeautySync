// core/entities/coupon.entity.ts

export type CouponType = 'percentage' | 'fixed';

export class Coupon {
  constructor(
    public readonly id: string,
    public readonly branchId: string,

    public readonly code: string,

    public readonly type: CouponType,
    public readonly value: number,

    public readonly minAmountCents: number | null,
    public readonly maxDiscountCents: number | null,

    public readonly usageLimit: number | null,
    public readonly usedCount: number,

    public readonly assignedToUserId: string | null,

    public readonly expiresAt: Date | null,

    public readonly isActive: boolean,

    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
