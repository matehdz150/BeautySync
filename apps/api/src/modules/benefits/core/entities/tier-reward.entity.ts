// core/entities/tier-reward.entity.ts

export type TierRewardType = 'ONE_TIME' | 'RECURRING';

export type TierRewardConfig =
  | {
      type: 'gift_card';
      amountCents: number;
      expiresInDays?: number;
    }
  | {
      type: 'coupon_percentage';
      value: number;
      expiresInDays?: number;
    }
  | {
      type: 'coupon_fixed';
      value: number;
      expiresInDays?: number;
    };

export interface TierReward {
  id: string;

  tierId: string;

  type: TierRewardType;

  config: TierRewardConfig; // 👈 luego lo tipamos mejor con validators

  createdAt: Date | null;
}
