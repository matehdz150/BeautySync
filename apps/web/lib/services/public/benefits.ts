import { publicFetch } from "./apiPublic";

// ===============================
// TYPES
// ===============================

export type UserWalletItem = {
  points: number;

  branch: {
    id: string;
    name: string;
    address: string | null;
    slug: string | null;
    coverUrl: string | null;
  };

  benefits: {
    hasGiftCard: boolean;
    totalGiftCardCents: number;

    bestCoupon: {
      type: "percentage" | "fixed";
      value: number;
    } | null;
  };

  // 🔥 NEW
  tier: {
    name: string;
    color: string | null;
    icon: string | null;
  } | null;
};

export type UserWalletResponse = {
  global: {
    totalGiftCardCents: number;
  };
  branches: UserWalletItem[];
};

export type BranchBenefitsSummaryResponse = {
  program: {
    exists: boolean;
    isActive: boolean;
    id: string | null;
    name: string | null;
  };
  points: number;
  currentTier: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
    minPoints: number;
    position: number;
  } | null;
  nextTier: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
    minPoints: number;
    position: number;
  } | null;
  pointsToNextTier: number;
  rewards: {
    all: Array<{
      id: string;
      programId: string;
      name: string;
      type: "SERVICE" | "PRODUCT" | "COUPON" | "GIFT_CARD" | "CUSTOM";
      referenceId?: string | null;
      pointsCost: number;
      isActive: boolean;
      config?: Record<string, unknown>;
      service?: {
        id: string;
        organizationId: string;
        branchId: string;
        categoryId: string | null;
        name: string;
        description: string | null;
        durationMin: number;
        priceCents: number | null;
        notes: string[];
        serviceRules: string[];
        isActive: boolean;
      } | null;
      product?: {
        id: string;
        branchId: string;
        name: string;
        slug: string;
        description?: string | null;
        priceCents: number;
        costCents?: number | null;
        sku?: string | null;
        imageUrl?: string | null;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      } | null;
      available: boolean;
    }>;
    available: Array<{
      id: string;
      programId: string;
      name: string;
      type: "SERVICE" | "PRODUCT" | "COUPON" | "GIFT_CARD" | "CUSTOM";
      referenceId?: string | null;
      pointsCost: number;
      isActive: boolean;
      config?: Record<string, unknown>;
      service?: {
        id: string;
        organizationId: string;
        branchId: string;
        categoryId: string | null;
        name: string;
        description: string | null;
        durationMin: number;
        priceCents: number | null;
        notes: string[];
        serviceRules: string[];
        isActive: boolean;
      } | null;
      product?: {
        id: string;
        branchId: string;
        name: string;
        slug: string;
        description?: string | null;
        priceCents: number;
        costCents?: number | null;
        sku?: string | null;
        imageUrl?: string | null;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      } | null;
      available: true;
    }>;
    unavailable: Array<{
      id: string;
      programId: string;
      name: string;
      type: "SERVICE" | "PRODUCT" | "COUPON" | "GIFT_CARD" | "CUSTOM";
      referenceId?: string | null;
      pointsCost: number;
      isActive: boolean;
      config?: Record<string, unknown>;
      service?: {
        id: string;
        organizationId: string;
        branchId: string;
        categoryId: string | null;
        name: string;
        description: string | null;
        durationMin: number;
        priceCents: number | null;
        notes: string[];
        serviceRules: string[];
        isActive: boolean;
      } | null;
      product?: {
        id: string;
        branchId: string;
        name: string;
        slug: string;
        description?: string | null;
        priceCents: number;
        costCents?: number | null;
        sku?: string | null;
        imageUrl?: string | null;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      } | null;
      available: false;
    }>;
  };
};

// ===============================
// API
// ===============================

export async function getUserWallet(): Promise<UserWalletResponse> {
  return publicFetch<UserWalletResponse>(
    `/benefits/program/wallet`
  );
}

export async function getBranchBenefitsSummary(
  branchId: string,
): Promise<BranchBenefitsSummaryResponse> {
  return publicFetch<BranchBenefitsSummaryResponse>(
    `/benefits/program/branch-summary?branchId=${branchId}`,
  );
}
