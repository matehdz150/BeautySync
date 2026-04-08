import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';
import { BenefitProgram } from '../entities/benefit-program.entity';

export type ActivateBenefitProgramInput = {
  branchId: string;
  name?: string;
  user: AuthenticatedUser;
};
export type RedeemBenefitRewardInput = {
  rewardId: string;
  branchId: string;
  idempotencyKey?: string; // si no llega, backend genera una
  user: AuthenticatedUser;
};
export interface BenefitProgramRepository {
  findByBranchId(branchId: string): Promise<BenefitProgram | null>;

  create(data: {
    branchId: string;
    name?: string;
    isActive: boolean;
  }): Promise<BenefitProgram>;

  update(
    id: string,
    data: Partial<{ isActive: boolean; name: string }>,
  ): Promise<BenefitProgram>;

  findById(id: string): Promise<BenefitProgram | null>;
}
