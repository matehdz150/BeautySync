import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';
import { BenefitRewardType } from '../engine/types';

export interface BenefitReward {
  id: string;
  programId: string;
  name: string;
  type: BenefitRewardType;
  referenceId?: string | null;
  pointsCost: number;
  isActive: boolean;
  config?: Record<string, unknown>;
}
export type CreateBenefitRewardInput = {
  branchId: string;
  type: BenefitRewardType;
  name: string;
  pointsCost: number;
  referenceId?: string;
  stock?: number | null;
  config?: Record<string, unknown>;
  user: AuthenticatedUser;
};

export interface BenefitRewardRepository {
  findById(id: string): Promise<BenefitReward | null>;
  findActiveByProgram(programId: string): Promise<BenefitReward[]>;
  create(data: {
    programId: string;
    type: BenefitRewardType;
    name: string;
    pointsCost: number;
    referenceId?: string | null;
    stock?: number | null;
    config?: Record<string, unknown>;
    isActive: boolean;
  }): Promise<BenefitReward>;

  update(
    id: string,
    data: {
      type?: string;
      name?: string;
      pointsCost?: number;
      referenceId?: string | null;
      stock?: number | null;
      config?: Record<string, unknown>;
      isActive?: boolean;
    },
  ): Promise<BenefitReward>;

  delete(id: string): Promise<void>;
}
