import { BenefitRewardType, RedeemRewardInput } from './types';
export type RewardResult =
  | {
      type: 'GIFT_CARD';
      code: string;
      amountCents: number;
      giftCardId: string;
    }
  | {
      type: 'COUPON';
      code: string;
      couponId: string;
      value: number;
      expiresAt: string | null;
    }
  | {
      type: 'SERVICE';
      code: string;
      serviceId: string;
    };
export interface BenefitRewardHandler {
  supports(type: BenefitRewardType): boolean;

  redeem(input: RedeemRewardInput): Promise<RewardResult>;
}
