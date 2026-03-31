import { api } from "./api";

/* =========================
   TYPES
========================= */

export type Coupon = {
  id: string;
  branchId: string;
  code: string;

  type: "percentage" | "fixed";
  value: number;

  minAmountCents?: number | null;
  maxDiscountCents?: number | null;

  usageLimit?: number | null;
  usedCount: number;

  assignedToUserId?: string | null;

  expiresAt?: string | null;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
};

export type ValidateCouponResponse = {
  couponId: string;
  discountCents: number;
  finalAmount: number;
};

/* =========================
   CREATE (ADMIN)
========================= */

export async function createCoupon(input: {
  branchId: string;
  code: string;

  type: "percentage" | "fixed";
  value: number;

  minAmountCents?: number;
  maxDiscountCents?: number;

  usageLimit?: number;
  assignedToUserId?: string;

  serviceIds?: string[];

  expiresAt?: string;
}) {
  return api<Coupon>("/coupons", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/* =========================
   VALIDATE (PUBLIC CHECKOUT)
========================= */

export async function validateCoupon(input: {
  code: string;
  branchId: string;
  amountCents: number;
}) {
  return api<ValidateCouponResponse>("/coupons/validate", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getCouponsByBranch(branchId: string) {
  return api<Coupon[]>(`/coupons/branch/${branchId}`);
}