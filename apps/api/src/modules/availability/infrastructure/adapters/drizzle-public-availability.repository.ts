import { Injectable } from '@nestjs/common';
import { AvailabilityPublicRepository } from '../../core/ports/availability-public.repository';
import { AvailabilityPublicService } from './availability.public.service';
import { ChainStep } from '../../core/entities/availability-chain.entity';

@Injectable()
export class DrizzleAvailabilityPublicRepository implements AvailabilityPublicRepository {
  constructor(private readonly service: AvailabilityPublicService) {}

  getAvailableDates(params: {
    slug: string;
    requiredDurationMin: number;
    staffId?: string;
    month?: string;
  }) {
    return this.service.getAvailableDates(params);
  }

  getAvailableTimes(params: {
    slug: string;
    serviceId?: string;
    requiredDurationMin?: number;
    date: string;
    staffId?: string;
  }) {
    return this.service.getAvailableTimes(params);
  }

  getAvailableTimesChain(params: {
    slug: string;
    date: string;
    chain: ChainStep[];
  }) {
    return this.service.getAvailableTimesChain(params);
  }
}
