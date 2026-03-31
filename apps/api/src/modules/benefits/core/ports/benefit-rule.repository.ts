// core/ports/benefit-rule.repository.ts

import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';
import { BenefitEarnRuleType } from '../engine/benefit-rule-handler.interface';
import { BenefitEarnRuleEntity } from '../entities/benefit-rule.entity';

export type ProcessBookingBenefitsInput = {
  userId: string;
  branchId: string;
  bookingId: string;
  amountCents: number;
  isOnline: boolean;
};

export type CreateBenefitEarnRuleInput = {
  branchId: string;
  type: BenefitEarnRuleType;
  config: unknown; // 👈 raw (viene del cliente)
  user: AuthenticatedUser;
};

export interface BenefitRuleRepository {
  findActiveByBranch(branchId: string): Promise<BenefitEarnRuleEntity[]>;
  create(data: {
    programId: string;
    type: BenefitEarnRuleType;
    config: any;
    isActive: boolean;
  }): Promise<BenefitEarnRuleEntity>;
}
