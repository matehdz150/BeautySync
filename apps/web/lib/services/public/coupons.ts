/* =====================
   TYPES
===================== */

export type ValidateCouponPayload = {
  code: string;
  branchId: string;
  amountCents: number;
  services?: string[];
};

export type ValidateCouponResponse = {
  coupon: {
        id: string,
        code: string,
        type: string, // "percentage" | "fixed"
        value: number, // 20 o 500
      },
      discountCents: number,
      finalAmount: number,
};

/* =====================
   API
===================== */

import { publicFetch } from "./apiPublic";

export async function validateCoupon(
  payload: ValidateCouponPayload
): Promise<ValidateCouponResponse> {
  return publicFetch<ValidateCouponResponse>(
    `/coupons/validate`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}