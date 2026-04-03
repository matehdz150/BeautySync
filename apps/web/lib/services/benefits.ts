// services/benefits.ts

import { api } from "./api";

export async function activateBenefitProgram(data: {
  branchId: string;
  name?: string;
}) {
  return api<{
    id: string;
    branchId: string;
    isActive: boolean;
    name?: string;
  }>("/benefits/program/activate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type BenefitProgramState = {
  exists: boolean;
  isActive: boolean;
  name: string | null;
};

export type BenefitReward = {
  id: string;
  name: string;
  type:
    | "SERVICE"
    | "PRODUCT"
    | "COUPON"
    | "GIFT_CARD"
    | "CUSTOM";
  pointsCost: number;
  isActive: boolean;
  stock?: number | null;
  config?: Record<string, unknown>;
};

export type BenefitRule = {
  id: string;
  type:
    | "BOOKING_COUNT"
    | "SPEND_ACCUMULATED"
    | "REVIEW_CREATED"
    | "ONLINE_PAYMENT"
    | "FIRST_BOOKING"
    | "REFERRAL";
  isActive: boolean;
  config: Record<string, unknown>;
};

export type GetBenefitRulesResponse = {
  program: BenefitProgramState;
  rules: BenefitRule[];
  rewards: BenefitReward[];
};

export async function getBenefitRulesByBranch(branchId: string) {
  return api<GetBenefitRulesResponse>(
    `/benefits/program/branch/${branchId}`,
    {
      method: "GET",
    }
  );
}

// ===============================
// CREATE BENEFIT RULE
// ===============================

export type BenefitRuleType =
  | "BOOKING_COUNT"
  | "SPEND_ACCUMULATED"
  | "REVIEW_CREATED"
  | "ONLINE_PAYMENT"
  | "FIRST_BOOKING"
  | "REFERRAL";

export async function createBenefitRule(data: {
  branchId: string;
  type: BenefitRuleType;
  config: Record<string, unknown>;
}) {
  return api<BenefitRule>("/benefits/program/earnrule", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type BenefitRewardType =
  | "SERVICE"
  | "PRODUCT"
  | "COUPON"
  | "GIFT_CARD"
  | "CUSTOM";

export type BenefitRewardCreate = {
  id: string;
  name: string;
  type: BenefitRewardType;
  pointsCost: number;
  isActive: boolean;
  referenceId?: string | null;
  stock?: number | null;
  config?: Record<string, unknown>;
};
type GiftCardConfig = {
  amountCents: number;
};

type CouponConfig = {
  type: "percentage" | "fixed";
  value: number;
  expiresAt?: string;
};
export async function createBenefitReward(data: {
  branchId: string;
  type: BenefitRewardType;
  name: string;
  pointsCost: number;
  referenceId?: string;
  stock?: number;
  config?: GiftCardConfig | CouponConfig | Record<string, unknown>;
}) {
  return api<BenefitRewardCreate>("/benefits/program/reward", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ===============================
// TIERS
// ===============================

export type TierRewardType = "ONE_TIME" | "RECURRING";

export type TierRewardConfig =
  | {
      type: "gift_card";
      amountCents: number;
      expiresInDays?: number;
    }
  | {
      type: "coupon_percentage";
      value: number;
      expiresInDays?: number;
    }
  | {
      type: "coupon_fixed";
      value: number;
      expiresInDays?: number;
    };

export type CreateTierInput = {
  branchId: string;

  name: string;
  description?: string;
  color?: string;
  icon?: string;

  minPoints: number;

  rewards?: {
    type: TierRewardType;
    config: TierRewardConfig;
  }[];
};

export type TierResponse = {
  tier: {
    id: string;
    programId: string;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    minPoints: number;
    position: number;
    createdAt: string;
  };
  rewards: {
    id: string;
    tierId: string;
    type: TierRewardType;
    config: TierRewardConfig;
    createdAt: string | null;
  }[];
};

export async function createTier(data: CreateTierInput) {
  return api<TierResponse>("/benefits/tiers", {
    method: "POST",
    body: JSON.stringify({
      ...data,
      rewards: data.rewards ?? [],
    }),
  });
}

export type BranchTierItem = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  minPoints: number;
};

export async function getBranchTiers(branchId: string) {
  return api<BranchTierItem[]>(
    `/benefits/tiers/${branchId}`,
    {
      method: "GET",
    }
  );
}