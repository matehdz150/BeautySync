import { Inject, Injectable } from '@nestjs/common';
import * as client from 'src/modules/db/client';

import { AvailabilityRepository } from '../../core/ports/availability.repository';
import { AvailabilityChainRepository } from '../../core/ports/availability-chain.repository';

import { GetAvailabilityDto } from '../../application/dto/create-availability.dto';

import { AvailabilityService } from './availability.service';
import { AvailabilityCoreService } from './availability-chain.service';
import { ChainStep } from '../../core/entities/availability-chain.entity';

@Injectable()
export class DrizzleAvailabilityRepository
  implements AvailabilityRepository, AvailabilityChainRepository
{
  constructor(
    @Inject('DB') private db: client.DB,

    // reutilizamos tu engine actual
    private readonly availabilityService: AvailabilityService,
    private readonly chainCore: AvailabilityCoreService,
  ) {}

  // -------------------------
  // availability
  // -------------------------

  getAvailability(query: GetAvailabilityDto) {
    return this.availabilityService.getAvailability(query);
  }

  // -------------------------
  // available services for slot
  // -------------------------

  getAvailableServicesForSlot(params: {
    branchId: string;
    staffId: string;
    datetime: string;
  }) {
    return this.availabilityService.getAvailableServicesForSlot(params);
  }

  // -------------------------
  // available services at
  // -------------------------

  getAvailableServicesAt(params: { branchId: string; datetime: string }) {
    return this.availabilityService.getAvailableServicesAt(params);
  }

  // -------------------------
  // chain availability
  // -------------------------

  getAvailableTimesChain(params: {
    branchId: string;
    date: string;
    chain: ChainStep[];
  }) {
    return this.chainCore.getAvailableTimesChain(params);
  }
}
