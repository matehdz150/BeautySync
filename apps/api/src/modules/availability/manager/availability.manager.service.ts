import { Injectable } from '@nestjs/common';
import { AvailabilityCoreService } from '../availability-chain.service';

@Injectable()
export class AvailabilityManagerService {
  constructor(private readonly core: AvailabilityCoreService) {}

  getAvailableTimesChain(params: {
    branchId: string;
    date: string;
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    chain: { serviceId: string; staffId: string | 'ANY' }[];
  }) {
    return this.core.getAvailableTimesChain(params);
  }
}
