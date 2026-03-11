import { Inject, Injectable } from '@nestjs/common';
import { AVAILABILITY_PUBLIC_REPOSITORY } from '../../ports/tokens';
import { AvailabilityPublicRepository } from '../../ports/availability-public.repository';

@Injectable()
export class GetPublicAvailableDatesUseCase {
  constructor(
    @Inject(AVAILABILITY_PUBLIC_REPOSITORY)
    private readonly repo: AvailabilityPublicRepository,
  ) {}

  execute(params: {
    slug: string;
    requiredDurationMin: number;
    staffId?: string;
    month?: string;
  }) {
    return this.repo.getAvailableDates(params);
  }
}
