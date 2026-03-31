import { BenefitRewardType } from '../engine/ types';

export interface BenefitReward {
  id: string;
  programId: string;
  type: BenefitRewardType;
  referenceId?: string | null;
  pointsCost: number;
  isActive: boolean;
  config?: Record<string, unknown>;
}

export interface BenefitRewardRepository {
  findById(id: string): Promise<BenefitReward | null>;
}
