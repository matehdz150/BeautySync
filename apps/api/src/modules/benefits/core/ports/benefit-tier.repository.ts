import { DbOrTx } from 'src/modules/db/client';
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
  getByProgram(
    programId: string,
    tx?: DbOrTx, // 🔥 ESTO FALTABA
  ): Promise<
    {
      id: string;
      minPoints: number;
      position: number;
      color: string | null;
      icon: string | null;
      name: string;
    }[]
  >;

  create(
    input: {
      programId: string;
      name: string;
      description: string | null;
      color: string | null;
      icon: string | null;
      minPoints: number;
      position: number;
    },
    db?: DbOrTx,
  ): Promise<BenefitTier>;

  findById(id: string): Promise<BenefitTier | null>;
}
