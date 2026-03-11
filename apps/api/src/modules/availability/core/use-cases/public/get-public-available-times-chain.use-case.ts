import { Inject, Injectable } from '@nestjs/common';
import { AVAILABILITY_PUBLIC_REPOSITORY } from '../../ports/tokens';
import { AvailabilityPublicRepository } from '../../ports/availability-public.repository';
import { ChainStep } from '../../entities/availability-chain.entity';

@Injectable()
export class GetPublicAvailableTimesChainUseCase {
  constructor(
    @Inject(AVAILABILITY_PUBLIC_REPOSITORY)
    private readonly repo: AvailabilityPublicRepository,
  ) {}

  execute(params: { slug: string; date: string; chain: ChainStep[] }) {
    return this.repo.getAvailableTimesChain(params);
  }
}
