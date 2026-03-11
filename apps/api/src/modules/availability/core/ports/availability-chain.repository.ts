import { ChainPlan, ChainStep } from '../entities/availability-chain.entity';

export interface AvailabilityChainRepository {
  getAvailableTimesChain(params: {
    branchId: string;
    date: string;
    chain: ChainStep[];
  }): Promise<ChainPlan[]>;
}
