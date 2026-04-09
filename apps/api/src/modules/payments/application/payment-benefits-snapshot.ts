import { PaymentsRepositoryPort } from '../core/ports/payment.repository';

export const PAYMENT_BENEFITS_SNAPSHOT_VERSION = 1;
export const PAYMENT_BENEFITS_SNAPSHOT_TTL_SECONDS = 60 * 60 * 24;

type RawBenefitsSnapshot = Awaited<
  ReturnType<PaymentsRepositoryPort['getAvailableBenefits']>
>;

export type PaymentBenefitsSnapshot = {
  branchId: string;
  userId: string;
  version: number;
  updatedAt: string;
  hasActiveProgram: RawBenefitsSnapshot['hasActiveProgram'];
  giftCards: Array<{
    id: string;
    code: string;
    balanceCents: number;
    expiresAt: string | null;
  }>;
  coupons: Array<{
    id: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    expiresAt: string | null;
    serviceName?: string | null;
    serviceNames?: string[];
  }>;
  pointsBalance: RawBenefitsSnapshot['pointsBalance'];
  redeemableRewards: RawBenefitsSnapshot['redeemableRewards'];
  tier: RawBenefitsSnapshot['tier'];
  tierRewards: Array<{
    id: string;
    type: 'ONE_TIME' | 'RECURRING';
    config: Record<string, unknown>;
    granted: boolean;
    grantedAt: string | null;
    used: boolean;
  }>;
};

export function buildPaymentBenefitsSnapshotKey(
  branchId: string,
  userId: string,
) {
  return `benefits:snapshot:v${PAYMENT_BENEFITS_SNAPSHOT_VERSION}:branch:${branchId}:user:${userId}`;
}

export function buildPaymentBenefitsSnapshotPattern(branchId: string) {
  return `benefits:snapshot:v${PAYMENT_BENEFITS_SNAPSHOT_VERSION}:branch:${branchId}:user:*`;
}

export function mapPaymentBenefitsSnapshot(params: {
  branchId: string;
  userId: string;
  raw: RawBenefitsSnapshot;
}): PaymentBenefitsSnapshot {
  const { branchId, userId, raw } = params;

  return {
    branchId,
    userId,
    version: PAYMENT_BENEFITS_SNAPSHOT_VERSION,
    updatedAt: new Date().toISOString(),
    hasActiveProgram: raw.hasActiveProgram,
    giftCards: raw.giftCards.map((giftCard) => ({
      ...giftCard,
      expiresAt: giftCard.expiresAt
        ? new Date(giftCard.expiresAt).toISOString()
        : null,
    })),
    coupons: raw.coupons.map((coupon) => ({
      ...coupon,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString() : null,
    })),
    pointsBalance: raw.pointsBalance,
    redeemableRewards: raw.redeemableRewards,
    tier: raw.tier,
    tierRewards: raw.tierRewards.map((reward) => ({
      ...reward,
      grantedAt: reward.grantedAt ? new Date(reward.grantedAt).toISOString() : null,
    })),
  };
}
