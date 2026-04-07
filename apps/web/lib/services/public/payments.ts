import { publicFetch } from "./apiPublic";

export type PaymentBenefits = {
  isAuthenticated: boolean;
  hasActiveProgram: boolean;

  giftCards: {
    id: string;
    code: string;
    balanceCents: number;
    expiresAt?: string | null;
  }[];

  coupons: {
    id: string;
    code: string;
    type: "percentage" | "fixed";
    value: number;
    expiresAt?: string | null;
  }[];

  // Nuevo balance de puntos por sucursal
  pointsBalance: number;

  // Rewards del programa que el usuario puede pagar con sus puntos
  redeemableRewards: {
    availableCount: number;
    rewards: {
      id: string;
      name: string;
      pointsCost: number;
      type: "SERVICE" | "PRODUCT" | "COUPON" | "GIFT_CARD" | "CUSTOM";
      referenceId?: string | null;
      config?: Record<string, unknown>;
    }[];
  };

  // Tier actual del usuario en la sucursal (si aplica)
  tier: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
  } | null;

  // Recompensas otorgadas por el tier (one-time o recurring)
  tierRewards: {
    id: string;
    type: "ONE_TIME" | "RECURRING";
    config: Record<string, unknown>;
    granted: boolean;
    grantedAt: string | null;
    used: boolean;
  }[];
};

export async function getPaymentBenefits(
  branchId: string
): Promise<PaymentBenefits> {
  return publicFetch<PaymentBenefits>(
    `/public-payments/benefits?branchId=${branchId}`,
    {
      method: "GET",
    }
  );
}
