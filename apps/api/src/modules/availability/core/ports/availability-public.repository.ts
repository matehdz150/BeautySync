import { ChainStep } from '../entities/availability-chain.entity';

export interface AvailabilityPublicRepository {
  getAvailableDates(params: {
    slug: string;
    requiredDurationMin: number;
    staffId?: string;
    month?: string;
  }): Promise<{ date: string; available: boolean }[]>;

  getAvailableTimes(params: {
    slug: string;
    serviceId?: string;
    requiredDurationMin?: number;
    date: string;
    staffId?: string;
  }): Promise<any>;

  getAvailableTimesChain(params: {
    slug: string;
    date: string;
    chain: ChainStep[];
  }): Promise<any>;
}
