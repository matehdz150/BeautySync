import { Inject, Injectable } from '@nestjs/common';
import { AVAILABILITY_PUBLIC_REPOSITORY } from '../../ports/tokens';
import { AvailabilityPublicRepository } from '../../ports/availability-public.repository';

@Injectable()
export class GetPublicAvailableTimesUseCase {
  constructor(
    @Inject(AVAILABILITY_PUBLIC_REPOSITORY)
    private readonly repo: AvailabilityPublicRepository,
  ) {}

  execute(params: {
    slug: string;
    serviceId?: string;
    requiredDurationMin?: number;
    date: string;
    staffId?: string;
  }) {
    return this.repo.getAvailableTimes(params);
  }
}
