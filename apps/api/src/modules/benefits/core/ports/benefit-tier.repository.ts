import { BenefitTier } from '../entities/benefit-tier.entity';

export interface CreateTierWithRewardsInput {
  branchId: string;

  name: string;
  description?: string;

  color?: string;
  icon?: string;

  minPoints: number;

  rewards: {
    type: 'ONE_TIME' | 'RECURRING';
    config: any;
  }[];
}

export interface BenefitTiersRepository {
  getByProgram(programId: string): Promise<
    {
      id: string;
      minPoints: number;
      position: number;
    }[]
  >;

  create(input: {
    programId: string;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    minPoints: number;
    position: number;
  }): Promise<BenefitTier>;
}
